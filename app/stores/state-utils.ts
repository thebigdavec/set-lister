import { STORAGE_KEYS } from '@/constants'
import { safeGetItem } from '@/utils/storage'
import {
  sanitizeSongTitle,
  sanitizeSongKey,
  sanitizeSetName
} from '@/utils/sanitize'
import { migrateToCurrentSchema, CURRENT_SCHEMA_VERSION } from '@/utils/schemaMigration'
import type { Song, SetItem, SetMetrics, StoreState } from './types'
import { buildSetMetrics, cloneEmptyMetrics } from './metrics'
import { isEncoreMarkerSong } from './encore'

export function createEmptySet(): SetItem {
  return {
    id: crypto.randomUUID(),
    songs: [],
    metrics: cloneEmptyMetrics()
  }
}

export function createDefaultState(): StoreState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      setListName: '',
      venue: '',
      date: '',
      actName: ''
    },
    sets: [createEmptySet()]
  }
}

function parseSavedState(raw: string | null): Partial<StoreState> | null {
  if (!raw) return null

  try {
    return JSON.parse(raw) as Partial<StoreState>
  } catch (error) {
    console.error('Failed to parse saved state', error)
    return null
  }
}

export function normalizeSongs(songs?: Song[]): Song[] {
  if (!Array.isArray(songs)) return []

  return songs.map((song, index) => ({
    id: typeof song?.id === 'string' ? song.id : crypto.randomUUID(),
    title: sanitizeSongTitle(song?.title, `Song ${index + 1}`),
    key: sanitizeSongKey(song?.key),
    isEncoreMarker: isEncoreMarkerSong(song)
  }))
}

export function normalizeSets(sets?: SetItem[]): SetItem[] {
  if (!Array.isArray(sets)) {
    return createDefaultState().sets
  }

  if (sets.length === 0) {
    return []
  }

  return sets.map(set => {
    const songs = normalizeSongs(set?.songs)
    return {
      id: typeof set?.id === 'string' ? set.id : crypto.randomUUID(),
      name: sanitizeSetName(set?.name),
      songs,
      metrics: buildSetMetrics(songs)
    }
  })
}

export function buildInitialState(): StoreState {
  const rawState = parseSavedState(safeGetItem(STORAGE_KEYS.DATA))
  const migratedState = rawState ? migrateToCurrentSchema(rawState) : null
  const savedState = migratedState
  const defaults = createDefaultState()

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      setListName:
        savedState?.metadata?.setListName ?? defaults.metadata.setListName,
      venue: savedState?.metadata?.venue ?? defaults.metadata.venue,
      date: savedState?.metadata?.date ?? defaults.metadata.date,
      actName: savedState?.metadata?.actName ?? defaults.metadata.actName
    },
    sets: normalizeSets(savedState?.sets)
  }
}
