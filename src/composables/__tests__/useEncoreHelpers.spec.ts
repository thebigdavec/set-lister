import { describe, it, expect, beforeEach } from "vitest";
import { ref, computed } from "vue";
import { useEncoreHelpers } from "../useEncoreHelpers";
import type { SetItem, Song } from "../../store";

// Helper to create a mock set
function createMockSet(songs: Song[] = []): SetItem {
  return {
    id: "test-set-id",
    name: "Test Set",
    songs,
    metrics: {
      longestEntryId: null,
      longestEntryText: "",
      longestEntryWidth16px: 0,
      totalRows: songs.filter((s) => !s.isEncoreMarker).length,
    },
  };
}

// Helper to create a mock song
function createMockSong(
  title: string,
  options: { id?: string; key?: string; isEncoreMarker?: boolean } = {}
): Song {
  return {
    id: options.id ?? `song-${Math.random().toString(36).slice(2)}`,
    title,
    key: options.key,
    isEncoreMarker: options.isEncoreMarker ?? false,
  };
}

// Helper to create an encore marker
function createEncoreMarker(): Song {
  return {
    id: "encore-marker-id",
    title: "<encore>",
    isEncoreMarker: true,
  };
}

describe("useEncoreHelpers", () => {
  describe("markerIndex", () => {
    it("should return -1 when not the last set", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(false) });

      expect(markerIndex.value).toBe(-1);
    });

    it("should return -1 when no encore marker exists", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(-1);
    });

    it("should return the index of the encore marker", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(1);
    });

    it("should handle encore marker at the beginning", () => {
      const set = ref(
        createMockSet([
          createEncoreMarker(),
          createMockSong("Song 1"),
          createMockSong("Song 2"),
        ])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(0);
    });

    it("should handle encore marker at the end", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createMockSong("Song 2"),
          createEncoreMarker(),
        ])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(2);
    });

    it("should support boolean isLast parameter", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker()])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: true });

      expect(markerIndex.value).toBe(1);
    });

    it("should support computed isLast parameter", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker()])
      );
      const isLast = computed(() => true);
      const { markerIndex } = useEncoreHelpers({ set, isLast });

      expect(markerIndex.value).toBe(1);
    });
  });

  describe("hasEncoreMarker", () => {
    it("should return false when not the last set", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker()])
      );
      const { hasEncoreMarker } = useEncoreHelpers({ set, isLast: ref(false) });

      expect(hasEncoreMarker.value).toBe(false);
    });

    it("should return false when no encore marker", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { hasEncoreMarker } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(hasEncoreMarker.value).toBe(false);
    });

    it("should return true when encore marker exists in last set", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { hasEncoreMarker } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(hasEncoreMarker.value).toBe(true);
    });
  });

  describe("markerIsLast", () => {
    it("should return false when no encore marker", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { markerIsLast } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIsLast.value).toBe(false);
    });

    it("should return false when encore marker is not last", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { markerIsLast } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIsLast.value).toBe(false);
    });

    it("should return true when encore marker is at the end", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createMockSong("Song 2"),
          createEncoreMarker(),
        ])
      );
      const { markerIsLast } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIsLast.value).toBe(true);
    });

    it("should return true when encore marker is the only song", () => {
      const set = ref(createMockSet([createEncoreMarker()]));
      const { markerIsLast } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIsLast.value).toBe(true);
    });
  });

  describe("firstEncoreSongId", () => {
    it("should return null when no encore marker", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { firstEncoreSongId } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(firstEncoreSongId.value).toBe(null);
    });

    it("should return null when encore marker is last (no songs after)", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createMockSong("Song 2"),
          createEncoreMarker(),
        ])
      );
      const { firstEncoreSongId } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(firstEncoreSongId.value).toBe(null);
    });

    it("should return the ID of the first song after encore marker", () => {
      const encoreSong = createMockSong("Encore Song", { id: "encore-song-1" });
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          encoreSong,
        ])
      );
      const { firstEncoreSongId } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(firstEncoreSongId.value).toBe("encore-song-1");
    });

    it("should return null when not the last set", () => {
      const encoreSong = createMockSong("Encore Song", { id: "encore-song-1" });
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          encoreSong,
        ])
      );
      const { firstEncoreSongId } = useEncoreHelpers({
        set,
        isLast: ref(false),
      });

      expect(firstEncoreSongId.value).toBe(null);
    });
  });

  describe("songsWithoutMarker", () => {
    it("should return all songs when no encore marker", () => {
      const song1 = createMockSong("Song 1");
      const song2 = createMockSong("Song 2");
      const set = ref(createMockSet([song1, song2]));
      const { songsWithoutMarker } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(songsWithoutMarker.value).toHaveLength(2);
      expect(songsWithoutMarker.value[0].title).toBe("Song 1");
      expect(songsWithoutMarker.value[1].title).toBe("Song 2");
    });

    it("should filter out encore marker", () => {
      const song1 = createMockSong("Song 1");
      const song2 = createMockSong("Song 2");
      const set = ref(createMockSet([song1, createEncoreMarker(), song2]));
      const { songsWithoutMarker } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(songsWithoutMarker.value).toHaveLength(2);
      expect(songsWithoutMarker.value[0].title).toBe("Song 1");
      expect(songsWithoutMarker.value[1].title).toBe("Song 2");
    });

    it("should return empty array for set with only encore marker", () => {
      const set = ref(createMockSet([createEncoreMarker()]));
      const { songsWithoutMarker } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(songsWithoutMarker.value).toHaveLength(0);
    });

    it("should return empty array for empty set", () => {
      const set = ref(createMockSet([]));
      const { songsWithoutMarker } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(songsWithoutMarker.value).toHaveLength(0);
    });
  });

  describe("isEncoreSong", () => {
    it("should return false when not the last set", () => {
      const song = createMockSong("Encore Song", { id: "song-1" });
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker(), song])
      );
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(false) });

      expect(isEncoreSong(song)).toBe(false);
    });

    it("should return false when no encore marker", () => {
      const song = createMockSong("Song 2", { id: "song-2" });
      const set = ref(createMockSet([createMockSong("Song 1"), song]));
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(isEncoreSong(song)).toBe(false);
    });

    it("should return false for songs before encore marker", () => {
      const song1 = createMockSong("Song 1", { id: "song-1" });
      const song2 = createMockSong("Song 2", { id: "song-2" });
      const set = ref(createMockSet([song1, createEncoreMarker(), song2]));
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(isEncoreSong(song1)).toBe(false);
    });

    it("should return true for songs after encore marker", () => {
      const song1 = createMockSong("Song 1", { id: "song-1" });
      const song2 = createMockSong("Song 2", { id: "song-2" });
      const set = ref(createMockSet([song1, createEncoreMarker(), song2]));
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(isEncoreSong(song2)).toBe(true);
    });

    it("should return true for multiple encore songs", () => {
      const song1 = createMockSong("Song 1", { id: "song-1" });
      const song2 = createMockSong("Song 2", { id: "song-2" });
      const song3 = createMockSong("Song 3", { id: "song-3" });
      const set = ref(
        createMockSet([song1, createEncoreMarker(), song2, song3])
      );
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(isEncoreSong(song2)).toBe(true);
      expect(isEncoreSong(song3)).toBe(true);
    });

    it("should return false for the encore marker itself", () => {
      const marker = createEncoreMarker();
      const set = ref(
        createMockSet([createMockSong("Song 1"), marker, createMockSong("Song 2")])
      );
      const { isEncoreSong } = useEncoreHelpers({ set, isLast: ref(true) });

      // The marker is at its own index, not after itself
      expect(isEncoreSong(marker)).toBe(false);
    });
  });

  describe("isEncoreSongByIndex", () => {
    it("should return false when not the last set", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { isEncoreSongByIndex } = useEncoreHelpers({
        set,
        isLast: ref(false),
      });

      expect(isEncoreSongByIndex(2)).toBe(false);
    });

    it("should return false when no encore marker", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { isEncoreSongByIndex } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(isEncoreSongByIndex(1)).toBe(false);
    });

    it("should return false for indices before encore marker", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { isEncoreSongByIndex } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(isEncoreSongByIndex(0)).toBe(false);
    });

    it("should return false for the encore marker index", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
        ])
      );
      const { isEncoreSongByIndex } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(isEncoreSongByIndex(1)).toBe(false);
    });

    it("should return true for indices after encore marker", () => {
      const set = ref(
        createMockSet([
          createMockSong("Song 1"),
          createEncoreMarker(),
          createMockSong("Song 2"),
          createMockSong("Song 3"),
        ])
      );
      const { isEncoreSongByIndex } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(isEncoreSongByIndex(2)).toBe(true);
      expect(isEncoreSongByIndex(3)).toBe(true);
    });
  });

  describe("reactivity", () => {
    it("should update markerIndex when songs change", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createMockSong("Song 2")])
      );
      const { markerIndex } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(-1);

      // Add encore marker
      set.value = createMockSet([
        createMockSong("Song 1"),
        createEncoreMarker(),
        createMockSong("Song 2"),
      ]);

      expect(markerIndex.value).toBe(1);
    });

    it("should update hasEncoreMarker when isLast changes", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker()])
      );
      const isLast = ref(true);
      const { hasEncoreMarker } = useEncoreHelpers({ set, isLast });

      expect(hasEncoreMarker.value).toBe(true);

      isLast.value = false;

      expect(hasEncoreMarker.value).toBe(false);
    });

    it("should update songsWithoutMarker when songs change", () => {
      const set = ref(createMockSet([createMockSong("Song 1")]));
      const { songsWithoutMarker } = useEncoreHelpers({
        set,
        isLast: ref(true),
      });

      expect(songsWithoutMarker.value).toHaveLength(1);

      set.value = createMockSet([
        createMockSong("Song 1"),
        createEncoreMarker(),
        createMockSong("Song 2"),
      ]);

      expect(songsWithoutMarker.value).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty set", () => {
      const set = ref(createMockSet([]));
      const { markerIndex, hasEncoreMarker, songsWithoutMarker } =
        useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(-1);
      expect(hasEncoreMarker.value).toBe(false);
      expect(songsWithoutMarker.value).toHaveLength(0);
    });

    it("should handle set with only encore marker", () => {
      const set = ref(createMockSet([createEncoreMarker()]));
      const {
        markerIndex,
        hasEncoreMarker,
        markerIsLast,
        songsWithoutMarker,
        firstEncoreSongId,
      } = useEncoreHelpers({ set, isLast: ref(true) });

      expect(markerIndex.value).toBe(0);
      expect(hasEncoreMarker.value).toBe(true);
      expect(markerIsLast.value).toBe(true);
      expect(songsWithoutMarker.value).toHaveLength(0);
      expect(firstEncoreSongId.value).toBe(null);
    });

    it("should handle boolean false for isLast", () => {
      const set = ref(
        createMockSet([createMockSong("Song 1"), createEncoreMarker()])
      );
      const { markerIndex, hasEncoreMarker } = useEncoreHelpers({
        set,
        isLast: false,
      });

      expect(markerIndex.value).toBe(-1);
      expect(hasEncoreMarker.value).toBe(false);
    });
  });
});
