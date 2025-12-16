import type { SetListMetadata, Song, SetItem, StoreState } from "../store";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a song object
 */
function isValidSong(song: unknown): song is Song {
  if (!song || typeof song !== "object") return false;

  const s = song as Partial<Song>;

  // id and title are required
  if (typeof s.id !== "string" || !s.id) return false;
  if (typeof s.title !== "string") return false;

  // key is optional but must be string if present
  if (s.key !== undefined && typeof s.key !== "string") return false;

  // isEncoreMarker is optional but must be boolean if present
  if (s.isEncoreMarker !== undefined && typeof s.isEncoreMarker !== "boolean") {
    return false;
  }

  return true;
}

/**
 * Validate a set object
 */
function isValidSet(set: unknown): set is SetItem {
  if (!set || typeof set !== "object") return false;

  const s = set as Partial<SetItem>;

  // id is required
  if (typeof s.id !== "string" || !s.id) return false;

  // name is optional but must be string if present
  if (s.name !== undefined && typeof s.name !== "string") return false;

  // songs must be an array
  if (!Array.isArray(s.songs)) return false;

  // All songs must be valid
  if (!s.songs.every(isValidSong)) return false;

  return true;
}

/**
 * Validate metadata object
 */
function isValidMetadata(metadata: unknown): metadata is SetListMetadata {
  if (!metadata || typeof metadata !== "object") return false;

  const m = metadata as Partial<SetListMetadata>;

  // All fields are required (can be empty strings)
  if (typeof m.setListName !== "string") return false;
  if (typeof m.venue !== "string") return false;
  if (typeof m.date !== "string") return false;
  if (typeof m.actName !== "string") return false;

  return true;
}

/**
 * Validate a complete store state object
 */
export function validateSetListData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Data must be an object");
    return { valid: false, errors };
  }

  const candidate = data as Partial<StoreState>;

  // Validate metadata
  if (!candidate.metadata) {
    errors.push("Missing metadata field");
  } else if (!isValidMetadata(candidate.metadata)) {
    errors.push("Invalid metadata format");
  }

  // Validate sets
  if (!candidate.sets) {
    errors.push("Missing sets field");
  } else if (!Array.isArray(candidate.sets)) {
    errors.push("Sets must be an array");
  } else if (candidate.sets.length === 0) {
    errors.push("Sets array cannot be empty");
  } else {
    // Validate each set
    candidate.sets.forEach((set, index) => {
      if (!isValidSet(set)) {
        errors.push(`Invalid set at index ${index}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard for StoreState
 */
export function isValidStoreState(data: unknown): data is StoreState {
  return validateSetListData(data).valid;
}

/**
 * Validate JSON string before parsing
 */
export function validateAndParseJSON(jsonString: string): {
  success: boolean;
  data?: unknown;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

