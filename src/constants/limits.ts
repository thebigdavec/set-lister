/**
 * Application-wide limits and constraints
 */

export const LIMITS = {
  // Input length limits
  MAX_SONG_TITLE_LENGTH: 200,
  MAX_SONG_KEY_LENGTH: 20,
  MAX_SET_NAME_LENGTH: 100,
  MAX_METADATA_FIELD_LENGTH: 500,

  // History limits
  HISTORY_CAPACITY: 100,

  // Encore requirements
  MIN_SONGS_FOR_ENCORE: 2,
} as const;

export type Limits = typeof LIMITS;

