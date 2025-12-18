import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  migrateToCurrentSchema,
  CURRENT_SCHEMA_VERSION
} from '../schemaMigration'

describe('schemaMigration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('CURRENT_SCHEMA_VERSION', () => {
    it('should be defined as 1', () => {
      expect(CURRENT_SCHEMA_VERSION).toBe(1)
    })
  })

  describe('migrateToCurrentSchema', () => {
    describe('invalid data handling', () => {
      it('should return null for null data', () => {
        const result = migrateToCurrentSchema(null)
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })

      it('should return null for undefined data', () => {
        const result = migrateToCurrentSchema(undefined)
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })

      it('should return null for non-object data', () => {
        expect(migrateToCurrentSchema('string')).toBeNull()
        expect(migrateToCurrentSchema(123)).toBeNull()
        expect(migrateToCurrentSchema(true)).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledTimes(3)
      })

      it('should return null for data without sets array', () => {
        const result = migrateToCurrentSchema({ metadata: {} })
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })

      it('should return null for data with non-array sets', () => {
        const result = migrateToCurrentSchema({ sets: 'not-an-array' })
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })

      it('should return null for data with invalid set objects', () => {
        const result = migrateToCurrentSchema({
          sets: [{ id: 'set-1' }] // Missing songs array
        })
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })

      it('should return null for data with invalid metadata', () => {
        const result = migrateToCurrentSchema({
          sets: [{ songs: [] }],
          metadata: 'invalid' // Should be an object
        })
        expect(result).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid data structure for migration'
        )
      })
    })

    describe('legacy data (version 1 without schemaVersion field)', () => {
      it('should migrate minimal legacy data', () => {
        const legacyData = {
          sets: []
        }

        const result = migrateToCurrentSchema(legacyData)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.sets).toEqual([])
      })

      it('should migrate legacy data with metadata', () => {
        const legacyData = {
          metadata: {
            setListName: 'My Show',
            venue: 'The Venue',
            date: '2024-01-01',
            actName: 'My Band'
          },
          sets: []
        }

        const result = migrateToCurrentSchema(legacyData)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.metadata).toEqual(legacyData.metadata)
        expect(result?.sets).toEqual([])
      })

      it('should migrate legacy data with sets and songs', () => {
        const legacyData = {
          metadata: {
            setListName: 'Test Show',
            venue: '',
            date: '',
            actName: ''
          },
          sets: [
            {
              id: 'set-1',
              name: 'Set 1',
              songs: [
                { id: 'song-1', title: 'Song One', key: 'C' },
                { id: 'song-2', title: 'Song Two' }
              ],
              metrics: {
                longestEntryId: 'song-1',
                longestEntryText: 'Song One (C)',
                longestEntryWidth16px: 100,
                totalRows: 2
              }
            }
          ]
        }

        const result = migrateToCurrentSchema(legacyData)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.metadata).toEqual(legacyData.metadata)
        expect(result?.sets).toEqual(legacyData.sets)
      })

      it('should preserve all fields from legacy data', () => {
        const legacyData = {
          metadata: {
            setListName: 'Show',
            venue: 'Venue',
            date: '2024-01-01',
            actName: 'Band'
          },
          sets: [
            {
              id: 'set-1',
              songs: [
                {
                  id: 'song-1',
                  title: 'Song',
                  key: 'D',
                  isEncoreMarker: false
                }
              ],
              metrics: {
                longestEntryId: null,
                longestEntryText: '',
                longestEntryWidth16px: 0,
                totalRows: 0
              }
            }
          ]
        }

        const result = migrateToCurrentSchema(legacyData)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        // All original fields should be preserved
        expect(result?.metadata).toEqual(legacyData.metadata)
        expect(result?.sets).toEqual(legacyData.sets)
      })
    })

    describe('current version data (version 1 with schemaVersion field)', () => {
      it('should pass through data that already has current schema version', () => {
        const currentData = {
          schemaVersion: 1,
          metadata: {
            setListName: 'Current Show',
            venue: 'Venue',
            date: '2024-01-01',
            actName: 'Band'
          },
          sets: [
            {
              id: 'set-1',
              songs: [{ id: 'song-1', title: 'Song' }],
              metrics: {
                longestEntryId: null,
                longestEntryText: '',
                longestEntryWidth16px: 0,
                totalRows: 0
              }
            }
          ]
        }

        const result = migrateToCurrentSchema(currentData)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.metadata).toEqual(currentData.metadata)
        expect(result?.sets).toEqual(currentData.sets)
      })

      it('should ensure schemaVersion is set even if data claims to be current', () => {
        const data = {
          schemaVersion: 1,
          sets: []
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      })
    })

    describe('edge cases', () => {
      it('should handle empty sets array', () => {
        const data = {
          metadata: {},
          sets: []
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.sets).toEqual([])
      })

      it('should handle sets with empty songs arrays', () => {
        const data = {
          sets: [
            { id: 'set-1', songs: [] },
            { id: 'set-2', songs: [] }
          ]
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.sets).toHaveLength(2)
      })

      it('should handle missing metadata field', () => {
        const data = {
          sets: [{ id: 'set-1', songs: [] }]
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.metadata).toBeUndefined()
      })

      it('should handle partial metadata', () => {
        const data = {
          metadata: {
            setListName: 'Only Name'
          },
          sets: []
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
        expect(result?.metadata).toEqual({ setListName: 'Only Name' })
      })

      it('should handle songs with minimal fields', () => {
        const data = {
          sets: [
            {
              id: 'set-1',
              songs: [
                { title: 'Song without ID' },
                { id: 'song-2' } // ID but no title
              ]
            }
          ]
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      })

      it('should handle sets without metrics', () => {
        const data = {
          sets: [
            {
              id: 'set-1',
              songs: [{ id: 'song-1', title: 'Song' }]
              // No metrics field
            }
          ]
        }

        const result = migrateToCurrentSchema(data)

        expect(result).not.toBeNull()
        expect(result?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      })
    })
  })
})
