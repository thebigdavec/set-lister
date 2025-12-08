import { computed, type Ref, type ComputedRef } from "vue";
import { isEncoreMarkerSong, type SetItem, type Song } from "../store";

/**
 * Options for useEncoreHelpers
 */
export interface EncoreHelpersOptions {
  /** The set to analyze for encore markers */
  set: Ref<SetItem> | ComputedRef<SetItem>;
  /** Whether this is the last set (encore markers only apply to last set) */
  isLast: Ref<boolean> | ComputedRef<boolean> | boolean;
}

/**
 * Composable for encore marker logic.
 * Consolidates duplicate encore-related computed properties and helpers
 * used across Set.vue and SetPreview.vue.
 */
export function useEncoreHelpers(options: EncoreHelpersOptions) {
  const { set, isLast } = options;

  // Normalize isLast to always be a ref-like getter
  const getIsLast = () =>
    typeof isLast === "boolean" ? isLast : isLast.value;

  /**
   * Index of the encore marker in the songs array, or -1 if not present.
   * Only meaningful for the last set.
   */
  const markerIndex = computed(() => {
    if (!getIsLast()) return -1;
    return set.value.songs.findIndex(isEncoreMarkerSong);
  });

  /**
   * Whether the set has an encore marker.
   */
  const hasEncoreMarker = computed(() => markerIndex.value !== -1);

  /**
   * Whether the encore marker is at the last position in the songs array.
   */
  const markerIsLast = computed(() => {
    if (markerIndex.value === -1) return false;
    return markerIndex.value === set.value.songs.length - 1;
  });

  /**
   * The ID of the first song after the encore marker (i.e., the first encore song).
   * Returns null if there's no encore marker or no song after it.
   */
  const firstEncoreSongId = computed(() => {
    const idx = markerIndex.value;
    if (idx === -1) return null;
    return set.value.songs[idx + 1]?.id ?? null;
  });

  /**
   * Songs filtered to exclude the encore marker.
   * Useful for rendering where the marker itself shouldn't be displayed.
   */
  const songsWithoutMarker = computed(() =>
    set.value.songs.filter((song) => !isEncoreMarkerSong(song)),
  );

  /**
   * Check if a song is an encore song (comes after the encore marker).
   * @param song - The song to check
   * @returns true if the song is an encore
   */
  function isEncoreSong(song: Song): boolean {
    if (!getIsLast()) return false;
    const idx = markerIndex.value;
    if (idx === -1) return false;
    const songIndex = set.value.songs.findIndex((s) => s.id === song.id);
    return songIndex > idx;
  }

  /**
   * Check if a song at a given index is an encore song.
   * @param index - The index of the song in the songs array
   * @returns true if the song at that index is an encore
   */
  function isEncoreSongByIndex(index: number): boolean {
    if (!getIsLast()) return false;
    const idx = markerIndex.value;
    if (idx === -1) return false;
    return index > idx;
  }

  return {
    markerIndex,
    hasEncoreMarker,
    markerIsLast,
    firstEncoreSongId,
    songsWithoutMarker,
    isEncoreSong,
    isEncoreSongByIndex,
  };
}
