import { LIMITS } from "../constants/limits";

/**
 * Sanitize a text input by trimming whitespace and limiting length.
 * Returns undefined if the result is empty.
 */
export function sanitizeTextInput(
  input: string | undefined,
  maxLength: number,
): string | undefined {
  if (input === undefined || input === null) return undefined;

  const trimmed = String(input).trim().slice(0, maxLength);
  return trimmed || undefined;
}

/**
 * Sanitize a song title.
 * Always returns a string (defaults to fallback if empty).
 */
export function sanitizeSongTitle(
  title: string | undefined,
  fallback = "Untitled Song",
): string {
  if (title === undefined || title === null) return fallback;

  const trimmed = String(title).trim().slice(0, LIMITS.MAX_SONG_TITLE_LENGTH);
  return trimmed || fallback;
}

/**
 * Sanitize a song key.
 * Returns undefined if empty.
 */
export function sanitizeSongKey(key: string | undefined): string | undefined {
  return sanitizeTextInput(key, LIMITS.MAX_SONG_KEY_LENGTH);
}

/**
 * Sanitize a set name.
 * Returns undefined if empty (to use dynamic default "Set N").
 */
export function sanitizeSetName(name: string | undefined): string | undefined {
  return sanitizeTextInput(name, LIMITS.MAX_SET_NAME_LENGTH);
}

/**
 * Sanitize metadata fields (setListName, venue, actName, date).
 * Returns undefined if empty.
 */
export function sanitizeMetadataField(
  field: string | undefined,
): string | undefined {
  return sanitizeTextInput(field, LIMITS.MAX_METADATA_FIELD_LENGTH);
}

/**
 * Sanitize all metadata fields at once.
 */
export function sanitizeMetadata(metadata: {
  setListName?: string;
  venue?: string;
  date?: string;
  actName?: string;
}): {
  setListName: string;
  venue: string;
  date: string;
  actName: string;
} {
  return {
    setListName: sanitizeMetadataField(metadata.setListName) ?? "",
    venue: sanitizeMetadataField(metadata.venue) ?? "",
    date: sanitizeMetadataField(metadata.date) ?? "",
    actName: sanitizeMetadataField(metadata.actName) ?? "",
  };
}

