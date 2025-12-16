import type { SetListMetadata } from "../store";

/**
 * Comparable song data - excludes computed/derived fields
 */
export interface ComparableSong {
  id: string;
  title: string;
  key: string | undefined;
  isEncoreMarker: boolean | undefined;
}

/**
 * Comparable set data - excludes metrics (which are derived)
 */
export interface ComparableSet {
  id: string;
  name?: string;
  songs: ComparableSong[];
}

/**
 * Comparable store data - what matters for dirty checking
 */
export interface ComparableData {
  metadata: SetListMetadata;
  sets: ComparableSet[];
}

/**
 * Deep comparison of two comparable data structures.
 * Returns true if the two states are equal.
 */
export function isDataEqual(
  a: ComparableData | null,
  b: ComparableData | null,
): boolean {
  if (a === null || b === null) return a === b;

  // Compare metadata
  if (
    a.metadata.setListName !== b.metadata.setListName ||
    a.metadata.venue !== b.metadata.venue ||
    a.metadata.date !== b.metadata.date ||
    a.metadata.actName !== b.metadata.actName
  ) {
    return false;
  }

  // Compare sets count
  if (a.sets.length !== b.sets.length) {
    return false;
  }

  // Compare each set
  for (let i = 0; i < a.sets.length; i++) {
    const setA = a.sets[i];
    const setB = b.sets[i];

    if (setA.id !== setB.id || setA.name !== setB.name) {
      return false;
    }

    // Compare songs count
    if (setA.songs.length !== setB.songs.length) {
      return false;
    }

    // Compare each song
    for (let j = 0; j < setA.songs.length; j++) {
      const songA = setA.songs[j];
      const songB = setB.songs[j];

      if (
        songA.id !== songB.id ||
        songA.title !== songB.title ||
        songA.key !== songB.key ||
        songA.isEncoreMarker !== songB.isEncoreMarker
      ) {
        return false;
      }
    }
  }

  return true;
}

