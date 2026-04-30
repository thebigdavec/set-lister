import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useHistory } from '@/composables/useHistory'
import { useSetlistStore } from '@/stores/store'

describe('useHistory', () => {
  let store: ReturnType<typeof useSetlistStore>

  beforeEach(() => {
    // Clear localStorage to ensure clean state
    localStorage.clear()

    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
    // Get a fresh store instance
    store = useSetlistStore()

    // Ensure we have a clean state with one empty set
    store.state.sets = [{
      id: crypto.randomUUID(),
      songs: [],
      metrics: {
        longestEntryId: null,
        longestEntryText: '',
        longestEntryWidth16px: 0,
        totalRows: 0
      }
    }]

    // Clear metadata
    store.state.metadata = {
      setListName: '',
      venue: '',
      date: '',
      actName: ''
    }

    // Mark as clean after setup
    store.markClean()
  })

  describe('initialization', () => {
    it('should initialize with canUndo as false', () => {
      const { canUndo } = useHistory()
      expect(canUndo.value).toBe(false)
    })

    it('should initialize with canRedo as false', () => {
      const { canRedo } = useHistory()
      expect(canRedo.value).toBe(false)
    })

    it('should have undoCount of 0 initially', () => {
      const { undoCount } = useHistory()
      expect(undoCount.value).toBe(0)
    })
  })

  describe('tracking changes', () => {
    it('should not create history entry when state does not actually change', async () => {
      const { undoCount } = useHistory()

      // First add a song so we have something to work with
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song', key: 'A' })
      await nextTick()

      // Should have 1 undo entry from adding the song
      expect(undoCount.value).toBe(1)

      // Get current song title
      const originalTitle = store.state.sets[0]!.songs[0]!.title

      // "Update" the song with the same title (no actual change)
      store.state.sets[0]!.songs[0]!.title = originalTitle

      await nextTick()

      // Should still have 1 undo entry since nothing actually changed
      expect(undoCount.value).toBe(1)
    })

    it('should not create history entry when saving set name without changes', async () => {
      const { undoCount } = useHistory()

      // Get current set name
      const originalName = store.state.sets[0]!.name

      // "Update" the set with the same name (no actual change)
      store.state.sets[0]!.name = originalName

      await nextTick()

      // Should still have 0 undo entries since nothing actually changed
      expect(undoCount.value).toBe(0)
    })

    it('should track song additions', async () => {
      const { canUndo } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song', key: 'C' })
      await nextTick()

      expect(canUndo.value).toBe(true)
    })

    it('should track set additions', async () => {
      const { canUndo } = useHistory()

      store.addSet()
      await nextTick()

      expect(canUndo.value).toBe(true)
    })

    it('should track metadata changes', async () => {
      const { canUndo } = useHistory()

      store.updateMetadata({ setListName: 'My Set List' })
      await nextTick()

      expect(canUndo.value).toBe(true)
    })

    it('should track song updates', async () => {
      const { canUndo, clearHistory } = useHistory()

      // Add a song first
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song', key: 'C' })
      await nextTick()

      // Clear history so we can test just the update
      clearHistory()
      expect(canUndo.value).toBe(false)

      // Update the song
      const songId = store.state.sets[0]!.songs[0]!.id
      store.updateSong(store.state.sets[0]!.id, songId, { title: 'Updated Song' })
      await nextTick()

      expect(canUndo.value).toBe(true)
    })

    it('should track set renames', async () => {
      const { canUndo } = useHistory()

      store.renameSet(store.state.sets[0]!.id, 'Renamed Set')
      await nextTick()

      expect(canUndo.value).toBe(true)
    })
  })

  describe('undo', () => {
    it('should undo song addition', async () => {
      const { undo } = useHistory()

      const setId = store.state.sets[0]!.id
      expect(store.state.sets[0]!.songs.length).toBe(0)

      store.addSongToSet(setId, { title: 'Test Song', key: 'C' })
      await nextTick()
      expect(store.state.sets[0]!.songs.length).toBe(1)

      undo()
      await nextTick()

      expect(store.state.sets[0]!.songs.length).toBe(0)
    })

    it('should undo metadata change', async () => {
      const { undo } = useHistory()

      expect(store.state.metadata.setListName).toBe('')

      store.updateMetadata({ setListName: 'My Set List' })
      await nextTick()
      expect(store.state.metadata.setListName).toBe('My Set List')

      undo()
      await nextTick()

      expect(store.state.metadata.setListName).toBe('')
    })

    it('should undo set addition', async () => {
      const { undo } = useHistory()

      expect(store.state.sets.length).toBe(1)

      store.addSet()
      await nextTick()
      expect(store.state.sets.length).toBe(2)

      undo()
      await nextTick()

      expect(store.state.sets.length).toBe(1)
    })

    it('should undo song removal', async () => {
      const { undo, clearHistory } = useHistory()

      const setId = store.state.sets[0]!.id
      store.addSongToSet(setId, { title: 'Test Song', key: 'C' })
      await nextTick()

      clearHistory()
      const songId = store.state.sets[0]!.songs[0]!.id

      store.removeSongFromSet(setId, songId)
      await nextTick()
      expect(store.state.sets[0]!.songs.length).toBe(0)

      undo()
      await nextTick()

      expect(store.state.sets[0]!.songs.length).toBe(1)
      expect(store.state.sets[0]!.songs[0]!.title).toBe('Test Song')
    })

    it('should do nothing when canUndo is false', async () => {
      const { undo, canUndo } = useHistory()

      expect(canUndo.value).toBe(false)
      const initialSetsLength = store.state.sets.length

      undo()
      await nextTick()

      expect(store.state.sets.length).toBe(initialSetsLength)
    })

    it('should update isDirty based on comparison to original state', async () => {
      const { undo } = useHistory()

      // After reset, isDirty should be false
      expect(store.isDirty).toBe(false)

      // Make a change - isDirty should become true
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song' })
      await nextTick()
      expect(store.isDirty).toBe(true)

      // Undo the change - isDirty should become false (back to original)
      undo()
      await nextTick()
      expect(store.isDirty).toBe(false)
    })

    it('should stay dirty after undo if there are still differences from original', async () => {
      const { undo } = useHistory()

      // Make two changes
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 1' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 2' })
      await nextTick()

      expect(store.isDirty).toBe(true)

      // Undo only the second change
      undo()
      await nextTick()

      // Should still be dirty because Song 1 is still there
      expect(store.isDirty).toBe(true)
    })
  })

  describe('redo', () => {
    it('should redo undone song addition', async () => {
      const { undo, redo } = useHistory()

      const setId = store.state.sets[0]!.id
      store.addSongToSet(setId, { title: 'Test Song', key: 'C' })
      await nextTick()

      undo()
      await nextTick()
      expect(store.state.sets[0]!.songs.length).toBe(0)

      redo()
      await nextTick()

      expect(store.state.sets[0]!.songs.length).toBe(1)
      expect(store.state.sets[0]!.songs[0]!.title).toBe('Test Song')
    })

    it('should redo undone metadata change', async () => {
      const { undo, redo } = useHistory()

      store.updateMetadata({ venue: 'Test Venue' })
      await nextTick()

      undo()
      await nextTick()
      expect(store.state.metadata.venue).toBe('')

      redo()
      await nextTick()

      expect(store.state.metadata.venue).toBe('Test Venue')
    })

    it('should enable canRedo after undo', async () => {
      const { undo, canRedo } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song' })
      await nextTick()
      expect(canRedo.value).toBe(false)

      undo()
      await nextTick()

      expect(canRedo.value).toBe(true)
    })

    it('should disable canRedo after new change', async () => {
      const { undo, canRedo } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song' })
      await nextTick()

      undo()
      await nextTick()
      expect(canRedo.value).toBe(true)

      // Make a new change
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Another Song' })
      await nextTick()

      expect(canRedo.value).toBe(false)
    })

    it('should do nothing when canRedo is false', async () => {
      const { redo, canRedo } = useHistory()

      expect(canRedo.value).toBe(false)
      const initialSetsLength = store.state.sets.length

      redo()
      await nextTick()

      expect(store.state.sets.length).toBe(initialSetsLength)
    })

    it('should update isDirty based on comparison to original state after redo', async () => {
      const { undo, redo } = useHistory()

      // Start clean
      expect(store.isDirty).toBe(false)

      // Make a change
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song' })
      await nextTick()
      expect(store.isDirty).toBe(true)

      // Undo - should be clean again
      undo()
      await nextTick()
      expect(store.isDirty).toBe(false)

      // Redo - should be dirty again
      redo()
      await nextTick()
      expect(store.isDirty).toBe(true)
    })

    it('should become clean when redo brings state back to saved state', async () => {
      const { undo, redo } = useHistory()

      // Make a change and save
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Test Song' })
      await nextTick()
      store.markClean() // Simulate saving
      expect(store.isDirty).toBe(false)

      // Make another change
      store.updateMetadata({ setListName: 'New Name' })
      await nextTick()
      expect(store.isDirty).toBe(true)

      // Undo the metadata change - should be clean (back to saved state)
      undo()
      await nextTick()
      expect(store.isDirty).toBe(false)

      // Redo - should be dirty again
      redo()
      await nextTick()
      expect(store.isDirty).toBe(true)
    })
  })

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      const { clearHistory, canUndo, canRedo, undoCount } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 1' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 2' })
      await nextTick()

      expect(canUndo.value).toBe(true)

      clearHistory()

      expect(canUndo.value).toBe(false)
      expect(canRedo.value).toBe(false)
      expect(undoCount.value).toBe(0)
    })

    it('should reset history to current state after clear', async () => {
      const { clearHistory, undo, canUndo } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 1' })
      await nextTick()

      clearHistory()

      // New change after clear
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 2' })
      await nextTick()

      expect(canUndo.value).toBe(true)

      // Undo should only undo Song 2
      undo()
      await nextTick()

      expect(store.state.sets[0]!.songs.length).toBe(1)
      expect(store.state.sets[0]!.songs[0]!.title).toBe('Song 1')
    })
  })

  describe('multiple undo/redo', () => {
    it('should support multiple undos', async () => {
      const { undo, undoCount } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 1' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 2' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 3' })
      await nextTick()

      expect(undoCount.value).toBe(3)
      // Account for auto-added encore marker
      const songsWithoutEncore = store.state.sets[0]!.songs.filter(
        s => !s.isEncoreMarker
      )
      expect(songsWithoutEncore.length).toBe(3)

      undo()
      await nextTick()
      undo()
      await nextTick()

      const songsAfterUndo = store.state.sets[0]!.songs.filter(s => !s.isEncoreMarker)
      expect(songsAfterUndo.length).toBe(1)
      expect(songsAfterUndo[0]!.title).toBe('Song 1')
    })

    it('should support multiple redos after multiple undos', async () => {
      const { undo, redo } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 1' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Song 2' })
      await nextTick()

      undo()
      await nextTick()
      undo()
      await nextTick()

      expect(store.state.sets[0]!.songs.length).toBe(0)

      redo()
      await nextTick()
      redo()
      await nextTick()

      // Account for encore marker that gets added with 2 songs
      const songsWithoutEncore = store.state.sets[0]!.songs.filter(
        s => !s.isEncoreMarker
      )
      expect(songsWithoutEncore.length).toBe(2)
    })
  })

  describe('complex state changes', () => {
    it('should handle song title and key updates correctly', async () => {
      const { undo, clearHistory } = useHistory()

      store.addSongToSet(store.state.sets[0]!.id, { title: 'Original Title', key: 'C' })
      await nextTick()

      clearHistory()

      const songId = store.state.sets[0]!.songs[0]!.id
      store.updateSong(store.state.sets[0]!.id, songId, {
        title: 'New Title',
        key: 'G'
      })
      await nextTick()

      expect(store.state.sets[0]!.songs[0]!.title).toBe('New Title')
      expect(store.state.sets[0]!.songs[0]!.key).toBe('G')

      undo()
      await nextTick()

      expect(store.state.sets[0]!.songs[0]!.title).toBe('Original Title')
      expect(store.state.sets[0]!.songs[0]!.key).toBe('C')
    })

    it('should handle multiple set operations', async () => {
      const { undo } = useHistory()

      store.addSet()
      await nextTick()
      store.addSet()
      await nextTick()

      expect(store.state.sets.length).toBe(3)

      undo()
      await nextTick()

      expect(store.state.sets.length).toBe(2)

      undo()
      await nextTick()

      expect(store.state.sets.length).toBe(1)
    })

    it('should handle combined metadata and set changes', async () => {
      const { undo } = useHistory()

      store.updateMetadata({ setListName: 'My Gig', venue: 'The Club' })
      await nextTick()
      store.addSongToSet(store.state.sets[0]!.id, { title: 'Opening Song' })
      await nextTick()

      expect(store.state.metadata.setListName).toBe('My Gig')
      expect(store.state.sets[0]!.songs.length).toBe(1)

      undo()
      await nextTick()

      expect(store.state.metadata.setListName).toBe('My Gig')
      expect(store.state.sets[0]!.songs.length).toBe(0)

      undo()
      await nextTick()

      expect(store.state.metadata.setListName).toBe('')
      expect(store.state.metadata.venue).toBe('')
    })
  })
})
