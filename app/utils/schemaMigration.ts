import type { StoreState, SetItem, Song, SetListMetadata } from '../store'

export const CURRENT_SCHEMA_VERSION = 1

/**
 * Type guard to check if a value is a valid song object
 */
function isValidSong(value: unknown): value is Partial<Song> {
  if (!value || typeof value !== 'object') return false
  const song = value as Record<string, unknown>
  
  // At minimum, we need an id or title to consider it a song
  return (
    typeof song.id === 'string' ||
    typeof song.title === 'string'
  )
}

/**
 * Type guard to check if a value is a valid set object
 */
function isValidSet(value: unknown): value is Partial<SetItem> {
  if (!value || typeof value !== 'object') return false
  const set = value as Record<string, unknown>
  
  // A set must have a songs array
  return Array.isArray(set.songs)
}

/**
 * Type guard to check if a value is a valid metadata object
 */
function isValidMetadata(value: unknown): value is Partial<SetListMetadata> {
  if (!value || typeof value !== 'object') return false
  // Metadata can be an empty object or have any of the expected fields
  return true
}

/**
 * Type guard to check if data has the basic structure of StoreState
 */
function hasStoreStateStructure(data: unknown): data is Partial<StoreState> {
  if (!data || typeof data !== 'object') return false
  const state = data as Record<string, unknown>
  
  // Must have a sets array
  if (!Array.isArray(state.sets)) return false
  
  // All items in sets must be valid sets
  if (!state.sets.every(isValidSet)) return false
  
  // If metadata exists, it must be valid
  if (state.metadata !== undefined && !isValidMetadata(state.metadata)) {
    return false
  }
  
  return true
}

/**
 * Detect the schema version of the data
 * @param data - The data to check
 * @returns The detected schema version (1 for legacy data without schemaVersion field)
 */
function detectSchemaVersion(data: unknown): number {
  if (!data || typeof data !== 'object') return 1
  
  const state = data as Record<string, unknown>
  
  // If schemaVersion exists and is a number, use it
  if (typeof state.schemaVersion === 'number') {
    return state.schemaVersion
  }
  
  // Legacy data without schemaVersion field is treated as version 1
  return 1
}

/**
 * Migrate version 1 data to current schema
 * Version 1 is the legacy format without schemaVersion field
 */
function migrateFromV1(data: Partial<StoreState>): Partial<StoreState> {
  // Version 1 data structure is the same as current, just add schemaVersion
  return {
    ...data,
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
}

/**
 * Migrate data to the current schema version
 * @param data - Unknown data that may be from an older schema version
 * @returns Data conforming to current StoreState structure, or null if invalid
 */
export function migrateToCurrentSchema(data: unknown): Partial<StoreState> | null {
  // Validate basic structure
  if (!hasStoreStateStructure(data)) {
    console.error('Invalid data structure for migration')
    return null
  }
  
  // Detect the schema version
  const version = detectSchemaVersion(data)
  
  // Apply migrations based on version
  let migratedData: Partial<StoreState> = data
  
  if (version === 1) {
    migratedData = migrateFromV1(data)
  }
  // Future versions would be handled here:
  // if (version === 2) {
  //   migratedData = migrateFromV2(data)
  // }
  
  // Ensure the final data has the current schema version
  return {
    ...migratedData,
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
}

