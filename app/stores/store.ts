import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/constants'
import { LIMITS } from '@/constants/limits'
import { safeSetItem } from '@/utils/storage'
import { sanitizeSongTitle, sanitizeSongKey, sanitizeSetName, sanitizeMetadata } from '@/utils/sanitize'
import { isDataEqual, type ComparableData } from '@/utils/stateComparison'
import { CURRENT_SCHEMA_VERSION } from '@/utils/schemaMigration'

// Import types
export type { Song, SetItem, SetListMetadata, StoreState, SetMetrics } from './types'
import type { Song, SetItem, SetListMetadata, StoreState } from './types'

// Import utilities
import { buildInitialState, createDefaultState, createEmptySet, normalizeSets } from './state-utils'
import { applySongAdditionMetrics, refreshSetMetrics } from './metrics'
import {
  isEncoreMarkerSong,
  hasEncoreMarker,
  createEncoreMarker,
  findEncoreMarkerIndex,
  countPlayableSongs
} from './encore'

export { hasEncoreMarker, isEncoreMarkerSong }



/**
 * Extract comparable data from the store state.
 * This excludes computed/derived fields like metrics.
 */
function extractComparableData(state: StoreState): ComparableData {
  return {
    metadata: { ...state.metadata },
    sets: state.sets.map(set => ({
      id: set.id,
      name: set.name,
      songs: set.songs.map(song => ({
        id: song.id,
        title: song.title,
        key: song.key,
        isEncoreMarker: song.isEncoreMarker
      }))
    }))
  }
}

export const useSetlistStore = defineStore('setlist', () => {
  // State
  const state = ref<StoreState>(buildInitialState())

  /**
   * The "original" state - snapshot from last save/load/new operation.
   * This is compared against the current store to determine if there are unsaved changes.
   */
  const originalState = ref<ComparableData | null>(extractComparableData(state.value))

  // Computed properties
  /**
   * Computed property that determines if there are unsaved changes.
   * Compares the current store state against the original state.
   */
  const isDirty = computed(() => {
    if (originalState.value === null) return true
    const currentData = extractComparableData(state.value)
    return !isDataEqual(originalState.value, currentData)
  })

  /**
   * Computed property for the ID of the last set in the list.
   * Returns null if there are no sets.
   */
  const lastSetId = computed(() =>
    state.value.sets.length ? state.value.sets[state.value.sets.length - 1]?.id ?? null : null
  )

  // Watchers
  watch(
    state,
    (newState) => {
      safeSetItem(STORAGE_KEYS.DATA, JSON.stringify(newState))
    },
    { deep: true }
  )

  // Actions
  function addSet(): void {
    state.value.sets.push(createEmptySet())
    sanitizeEncoreMarkers()
  }

  function removeSet(setId: string): void {
    const index = state.value.sets.findIndex(set => set.id === setId)
    if (index !== -1) {
      state.value.sets.splice(index, 1)
      sanitizeEncoreMarkers()
    }
  }

  function renameSet(setId: string, newName: string | undefined): void {
    const set = state.value.sets.find(s => s.id === setId)
    if (set) {
      set.name = sanitizeSetName(newName)
    }
  }

  function getSetDisplayName(setId: string): string {
    const index = state.value.sets.findIndex(s => s.id === setId)
    if (index === -1) return ''
    const set = state.value.sets[index]
    return set?.name || `Set ${index + 1}`
  }

  function addSongToSet(
    setId: string,
    song: {
      title: string
      key?: string
    }
  ): void {
    const set = state.value.sets.find(s => s.id === setId)
    if (set) {
      const newSong: Song = {
        id: crypto.randomUUID(),
        title: sanitizeSongTitle(song.title),
        key: sanitizeSongKey(song.key)
      }
      const markerIndex = findEncoreMarkerIndex(set)
      const markerIsLast =
        markerIndex !== -1 && markerIndex === set.songs.length - 1

      if (markerIsLast) {
        set.songs.splice(markerIndex, 0, newSong)
        refreshSetMetrics(set)
      } else {
        set.songs.push(newSong)
        applySongAdditionMetrics(set, newSong)
      }
      sanitizeEncoreMarkers()
    }
  }

  function removeSongFromSet(setId: string, songId: string): void {
    const set = state.value.sets.find(s => s.id === setId)
    if (set) {
      const index = set.songs.findIndex(s => s.id === songId)
      if (index !== -1) {
        set.songs.splice(index, 1)
        refreshSetMetrics(set)
        sanitizeEncoreMarkers()
      }
    }
  }

  function reorderSong(
    setId: string,
    fromIndex: number,
    toIndex: number
  ): void {
    const set = state.value.sets.find(s => s.id === setId)
    if (set && fromIndex >= 0 && toIndex >= 0 && fromIndex < set.songs.length) {
      const [movedSong] = set.songs.splice(fromIndex, 1)
      if (movedSong) {
        const insertIndex = Math.min(toIndex, set.songs.length)
        set.songs.splice(insertIndex, 0, movedSong)
        refreshSetMetrics(set)
      }
    }
  }

  function moveSong(
    fromSetId: string,
    toSetId: string,
    fromIndex: number,
    toIndex: number
  ): void {
    const fromSet = state.value.sets.find(s => s.id === fromSetId)
    const toSet = state.value.sets.find(s => s.id === toSetId)

    if (fromSet && toSet && fromIndex >= 0 && fromIndex < fromSet.songs.length) {
      const [movedSong] = fromSet.songs.splice(fromIndex, 1)
      if (!movedSong) return

      if (movedSong.isEncoreMarker && fromSetId !== toSetId) {
        // Encore marker stays within its original set
        fromSet.songs.splice(fromIndex, 0, movedSong)
        return
      }
      const insertIndex = Math.min(toIndex, toSet.songs.length)
      toSet.songs.splice(insertIndex, 0, movedSong)
      refreshSetMetrics(fromSet)
      refreshSetMetrics(toSet)
      sanitizeEncoreMarkers()
    }
  }

  function updateSong(
    setId: string,
    songId: string,
    updates: Partial<Omit<Song, 'id'>>
  ): void {
    const set = state.value.sets.find(s => s.id === setId)
    if (set) {
      const song = set.songs.find(s => s.id === songId)
      if (song) {
        // Sanitize updates before applying
        const sanitizedUpdates = {
          ...updates,
          ...(updates.title !== undefined && {
            title: sanitizeSongTitle(updates.title)
          }),
          ...(updates.key !== undefined && { key: sanitizeSongKey(updates.key) })
        }
        Object.assign(song, sanitizedUpdates)
        refreshSetMetrics(set)
      }
    }
  }

  function updateMetadata(updates: Partial<SetListMetadata>): void {
    const sanitized = sanitizeMetadata({
      setListName: updates.setListName ?? state.value.metadata.setListName,
      venue: updates.venue ?? state.value.metadata.venue,
      date: updates.date ?? state.value.metadata.date,
      actName: updates.actName ?? state.value.metadata.actName
    })
    Object.assign(state.value.metadata, sanitized)
  }

  /**
   * Mark the current state as "clean" by snapshotting it as the original state.
   * After calling this, isDirty will be false until further edits are made.
   */
  function markClean(): void {
    originalState.value = extractComparableData(state.value)
  }

  /**
   * Reset the store to default state and mark as clean.
   */
  function resetStore(): void {
    const newData = createDefaultState()
    state.value.schemaVersion = newData.schemaVersion
    state.value.sets = newData.sets
    state.value.metadata = newData.metadata
    sanitizeEncoreMarkers()
    originalState.value = extractComparableData(state.value)
  }

  function loadStore(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data format')
      return false
    }

    const candidate = data as Partial<StoreState>

    if (!Array.isArray(candidate.sets)) {
      console.error('Invalid data format: sets missing')
      return false
    }

    state.value.schemaVersion = CURRENT_SCHEMA_VERSION
    state.value.sets = normalizeSets(candidate.sets)
    state.value.metadata = sanitizeMetadata({
      setListName: candidate.metadata?.setListName,
      venue: candidate.metadata?.venue,
      date: candidate.metadata?.date,
      actName: candidate.metadata?.actName
    })
    sanitizeEncoreMarkers()
    originalState.value = extractComparableData(state.value)
    return true
  }

  function sanitizeEncoreMarkers(): void {
    if (!state.value.sets.length) return
    const lastIndex = state.value.sets.length - 1

    state.value.sets.forEach((set, index) => {
      const markerIndex = findEncoreMarkerIndex(set)
      const shouldHaveMarker =
        index === lastIndex &&
        countPlayableSongs(set) >= LIMITS.MIN_SONGS_FOR_ENCORE

      if (shouldHaveMarker && markerIndex === -1) {
        set.songs.push(createEncoreMarker())
        refreshSetMetrics(set)
      } else if (!shouldHaveMarker && markerIndex !== -1) {
        set.songs.splice(markerIndex, 1)
        refreshSetMetrics(set)
      }
    })
  }

  // Utility functions
  function getTotalDuration(): number {
    if (!state.value.sets.length) return 0

    // If there are no songs in the available sets, return zero
    if (!state.value.sets.some(set => set.songs.length)) return 0

    // Return 0 until durations are implemented
    return 0
  }

  function isLastSet(setId: string): boolean {
    return setId === lastSetId.value
  }

  // Return store interface
  return {
    // State
    state,
    // Computed
    isDirty,
    lastSetId,
    // Actions
    addSet,
    removeSet,
    renameSet,
    getSetDisplayName,
    addSongToSet,
    removeSongFromSet,
    reorderSong,
    moveSong,
    updateSong,
    updateMetadata,
    markClean,
    resetStore,
    loadStore,
    sanitizeEncoreMarkers,
    getTotalDuration,
    isLastSet
  }
})
