import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  store,
  addSet,
  removeSet,
  renameSet,
  addSongToSet,
  removeSongFromSet,
  reorderSong,
  moveSong,
  updateSong,
  updateMetadata,
  markClean,
  resetStore,
  loadStore,
  sanitizeEncoreMarkers,
  lastSetId,
  isLastSet,
  hasEncoreMarker,
  isEncoreMarkerSong,
  type SetItem,
  type Song,
} from "../store";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("store", () => {
  beforeEach(() => {
    // Reset store to default state before each test
    resetStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have default metadata", () => {
      expect(store.metadata.setListName).toBe("");
      expect(store.metadata.venue).toBe("");
      expect(store.metadata.date).toBe("");
      expect(store.metadata.actName).toBe("");
    });

    it("should start with one empty set", () => {
      expect(store.sets.length).toBe(1);
      expect(store.sets[0].name).toBe("Set 1");
      expect(store.sets[0].songs.length).toBe(0);
    });

    it("should not be dirty initially after reset", () => {
      expect(store.isDirty).toBe(false);
    });
  });

  describe("addSet", () => {
    it("should add a new set", () => {
      const initialCount = store.sets.length;
      addSet();
      expect(store.sets.length).toBe(initialCount + 1);
    });

    it("should name new sets sequentially", () => {
      addSet();
      expect(store.sets[store.sets.length - 1].name).toBe("Set 2");
      addSet();
      expect(store.sets[store.sets.length - 1].name).toBe("Set 3");
    });

    it("should mark store as dirty", () => {
      markClean();
      addSet();
      expect(store.isDirty).toBe(true);
    });

    it("should create set with empty songs array", () => {
      addSet();
      const newSet = store.sets[store.sets.length - 1];
      expect(newSet.songs).toEqual([]);
    });

    it("should generate unique IDs for sets", () => {
      addSet();
      addSet();
      const ids = store.sets.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("removeSet", () => {
    it("should remove a set by ID", () => {
      addSet();
      const setToRemove = store.sets[0];
      const initialCount = store.sets.length;
      removeSet(setToRemove.id);
      expect(store.sets.length).toBe(initialCount - 1);
      expect(store.sets.find((s) => s.id === setToRemove.id)).toBeUndefined();
    });

    it("should do nothing for non-existent ID", () => {
      const initialCount = store.sets.length;
      removeSet("non-existent-id");
      expect(store.sets.length).toBe(initialCount);
    });

    it("should mark store as dirty", () => {
      addSet();
      markClean();
      removeSet(store.sets[0].id);
      expect(store.isDirty).toBe(true);
    });
  });

  describe("renameSet", () => {
    it("should rename a set", () => {
      const set = store.sets[0];
      renameSet(set.id, "New Name");
      expect(store.sets[0].name).toBe("New Name");
    });

    it("should do nothing for non-existent ID", () => {
      const originalName = store.sets[0].name;
      renameSet("non-existent-id", "New Name");
      expect(store.sets[0].name).toBe(originalName);
    });

    it("should mark store as dirty", () => {
      markClean();
      renameSet(store.sets[0].id, "New Name");
      expect(store.isDirty).toBe(true);
    });
  });

  describe("addSongToSet", () => {
    it("should add a song to a set", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "My Song" });
      expect(set.songs.length).toBe(1);
      expect(set.songs[0].title).toBe("My Song");
    });

    it("should add a song with key", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "My Song", key: "Am" });
      expect(set.songs[0].key).toBe("Am");
    });

    it("should generate unique song IDs", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "Song 1" });
      addSongToSet(set.id, { title: "Song 2" });
      expect(set.songs[0].id).not.toBe(set.songs[1].id);
    });

    it("should mark store as dirty", () => {
      markClean();
      addSongToSet(store.sets[0].id, { title: "Test" });
      expect(store.isDirty).toBe(true);
    });

    it("should do nothing for non-existent set ID", () => {
      addSongToSet("non-existent-id", { title: "Test" });
      expect(store.sets[0].songs.length).toBe(0);
    });

    it("should update set metrics after adding song", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "A Very Long Song Title" });
      expect(set.metrics.totalRows).toBe(1);
      expect(set.metrics.longestEntryId).toBe(set.songs[0].id);
    });
  });

  describe("removeSongFromSet", () => {
    beforeEach(() => {
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      addSongToSet(store.sets[0].id, { title: "Song 2" });
    });

    it("should remove a song from a set", () => {
      const set = store.sets[0];
      const songToRemove = set.songs[0];
      removeSongFromSet(set.id, songToRemove.id);
      expect(set.songs.length).toBe(1);
      expect(set.songs.find((s) => s.id === songToRemove.id)).toBeUndefined();
    });

    it("should do nothing for non-existent song ID", () => {
      const set = store.sets[0];
      const initialCount = set.songs.length;
      removeSongFromSet(set.id, "non-existent-id");
      expect(set.songs.length).toBe(initialCount);
    });

    it("should mark store as dirty", () => {
      markClean();
      const set = store.sets[0];
      removeSongFromSet(set.id, set.songs[0].id);
      expect(store.isDirty).toBe(true);
    });

    it("should update metrics after removing song", () => {
      const set = store.sets[0];
      removeSongFromSet(set.id, set.songs[0].id);
      expect(set.metrics.totalRows).toBe(1);
    });
  });

  describe("reorderSong", () => {
    beforeEach(() => {
      addSongToSet(store.sets[0].id, { title: "Song A" });
      addSongToSet(store.sets[0].id, { title: "Song B" });
      addSongToSet(store.sets[0].id, { title: "Song C" });
    });

    it("should move a song from one position to another", () => {
      const set = store.sets[0];
      reorderSong(set.id, 0, 2);
      expect(set.songs[0].title).toBe("Song B");
      expect(set.songs[1].title).toBe("Song C");
      expect(set.songs[2].title).toBe("Song A");
    });

    it("should handle moving to the same position", () => {
      const set = store.sets[0];
      reorderSong(set.id, 1, 1);
      expect(set.songs[1].title).toBe("Song B");
    });

    it("should mark store as dirty", () => {
      markClean();
      reorderSong(store.sets[0].id, 0, 1);
      expect(store.isDirty).toBe(true);
    });
  });

  describe("moveSong", () => {
    beforeEach(() => {
      addSet();
      addSongToSet(store.sets[0].id, { title: "Song A" });
      addSongToSet(store.sets[0].id, { title: "Song B" });
      addSongToSet(store.sets[1].id, { title: "Song X" });
      addSongToSet(store.sets[1].id, { title: "Song Y" }); // Need 2+ songs to trigger encore marker
    });

    it("should move a song between sets", () => {
      const fromSet = store.sets[0];
      const toSet = store.sets[1];
      const initialToSetSongCount = toSet.songs.filter(
        (s) => !s.isEncoreMarker,
      ).length;
      moveSong(fromSet.id, toSet.id, 0, 0);
      expect(fromSet.songs.length).toBe(1);
      // toSet had 2 songs + encore marker, now has 3 songs + encore marker
      const newToSetSongCount = toSet.songs.filter(
        (s) => !s.isEncoreMarker,
      ).length;
      expect(newToSetSongCount).toBe(initialToSetSongCount + 1);
      expect(toSet.songs[0].title).toBe("Song A");
    });

    it("should mark store as dirty", () => {
      markClean();
      moveSong(store.sets[0].id, store.sets[1].id, 0, 0);
      expect(store.isDirty).toBe(true);
    });

    it("should update metrics for both sets", () => {
      const fromSet = store.sets[0];
      const toSet = store.sets[1];
      moveSong(fromSet.id, toSet.id, 0, 0);
      expect(fromSet.metrics.totalRows).toBe(1);
      // toSet had 2 songs, now has 3 after the move
      expect(toSet.metrics.totalRows).toBe(3);
    });
  });

  describe("updateSong", () => {
    beforeEach(() => {
      addSongToSet(store.sets[0].id, { title: "Original Title", key: "C" });
    });

    it("should update song title", () => {
      const set = store.sets[0];
      const song = set.songs[0];
      updateSong(set.id, song.id, { title: "New Title" });
      expect(song.title).toBe("New Title");
    });

    it("should update song key", () => {
      const set = store.sets[0];
      const song = set.songs[0];
      updateSong(set.id, song.id, { key: "G" });
      expect(song.key).toBe("G");
    });

    it("should mark store as dirty", () => {
      markClean();
      const set = store.sets[0];
      updateSong(set.id, set.songs[0].id, { title: "New" });
      expect(store.isDirty).toBe(true);
    });

    it("should update metrics after song update", () => {
      const set = store.sets[0];
      const song = set.songs[0];
      updateSong(set.id, song.id, { title: "A Much Longer Song Title Now" });
      expect(set.metrics.longestEntryText).toContain(
        "A Much Longer Song Title Now",
      );
    });
  });

  describe("updateMetadata", () => {
    it("should update setListName", () => {
      updateMetadata({ setListName: "My Show" });
      expect(store.metadata.setListName).toBe("My Show");
    });

    it("should update venue", () => {
      updateMetadata({ venue: "The Club" });
      expect(store.metadata.venue).toBe("The Club");
    });

    it("should update multiple fields at once", () => {
      updateMetadata({ date: "2024-01-01", actName: "The Band" });
      expect(store.metadata.date).toBe("2024-01-01");
      expect(store.metadata.actName).toBe("The Band");
    });

    it("should mark store as dirty", () => {
      markClean();
      updateMetadata({ setListName: "Test" });
      expect(store.isDirty).toBe(true);
    });
  });

  describe("markClean", () => {
    it("should set isDirty to false", () => {
      addSet(); // This makes store dirty
      expect(store.isDirty).toBe(true);
      markClean();
      expect(store.isDirty).toBe(false);
    });
  });

  describe("resetStore", () => {
    it("should reset to default state", () => {
      updateMetadata({ setListName: "Test Show" });
      addSet();
      addSongToSet(store.sets[0].id, { title: "Song" });
      resetStore();
      expect(store.metadata.setListName).toBe("");
      expect(store.sets.length).toBe(1);
      expect(store.sets[0].songs.length).toBe(0);
    });

    it("should set isDirty to false", () => {
      addSet();
      resetStore();
      expect(store.isDirty).toBe(false);
    });
  });

  describe("loadStore", () => {
    it("should load valid data", () => {
      const data = {
        metadata: {
          setListName: "Loaded Show",
          venue: "Venue",
          date: "2024-01-01",
          actName: "Band",
        },
        sets: [
          {
            id: "set-1",
            name: "Set 1",
            songs: [{ id: "song-1", title: "Song 1" }],
          },
        ],
      };
      const result = loadStore(data);
      expect(result).toBe(true);
      expect(store.metadata.setListName).toBe("Loaded Show");
      expect(store.sets[0].songs[0].title).toBe("Song 1");
    });

    it("should return false for invalid data", () => {
      const result = loadStore(null);
      expect(result).toBe(false);
    });

    it("should return false for data without sets array", () => {
      const result = loadStore({ metadata: {} });
      expect(result).toBe(false);
    });

    it("should set isDirty to false after loading", () => {
      addSet(); // Make dirty
      const data = { sets: [{ name: "Set 1", songs: [] }] };
      loadStore(data);
      expect(store.isDirty).toBe(false);
    });

    it("should normalize missing fields", () => {
      const data = {
        sets: [{ songs: [{ title: "Song" }] }],
      };
      loadStore(data);
      expect(store.metadata.setListName).toBe("");
      expect(store.sets[0].name).toBe("Set 1"); // Default name
      expect(store.sets[0].songs[0].id).toBeDefined();
    });
  });

  describe("lastSetId computed", () => {
    it("should return the ID of the last set", () => {
      expect(lastSetId.value).toBe(store.sets[0].id);
      addSet();
      expect(lastSetId.value).toBe(store.sets[1].id);
    });

    it("should update when sets change", () => {
      addSet();
      const newLastId = lastSetId.value;
      removeSet(store.sets[1].id);
      expect(lastSetId.value).not.toBe(newLastId);
    });
  });

  describe("isLastSet", () => {
    it("should return true for the last set", () => {
      expect(isLastSet(store.sets[0].id)).toBe(true);
    });

    it("should return false for non-last sets", () => {
      addSet();
      expect(isLastSet(store.sets[0].id)).toBe(false);
      expect(isLastSet(store.sets[1].id)).toBe(true);
    });

    it("should return false for non-existent ID", () => {
      expect(isLastSet("non-existent")).toBe(false);
    });
  });

  describe("hasEncoreMarker", () => {
    it("should return false for set without encore marker", () => {
      expect(hasEncoreMarker(store.sets[0])).toBe(false);
    });

    it("should return true when set has encore marker", () => {
      // Add enough songs to trigger encore marker
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(true);
    });
  });

  describe("isEncoreMarkerSong", () => {
    it("should return false for regular song", () => {
      addSongToSet(store.sets[0].id, { title: "Regular Song" });
      expect(isEncoreMarkerSong(store.sets[0].songs[0])).toBe(false);
    });

    it("should return true for encore marker", () => {
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      sanitizeEncoreMarkers();
      const marker = store.sets[0].songs.find((s) => s.isEncoreMarker);
      expect(isEncoreMarkerSong(marker)).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(isEncoreMarkerSong(undefined as unknown as Song)).toBe(false);
    });
  });

  describe("sanitizeEncoreMarkers", () => {
    it("should add encore marker to last set with 2+ songs", () => {
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(true);
    });

    it("should not add marker to last set with fewer than 2 songs", () => {
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(false);
    });

    it("should remove marker from non-last sets", () => {
      addSongToSet(store.sets[0].id, { title: "Song 1" });
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(true);
      addSet();
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(false);
    });

    it("should only keep marker in the last set", () => {
      addSet();
      addSongToSet(store.sets[0].id, { title: "S1" });
      addSongToSet(store.sets[0].id, { title: "S2" });
      addSongToSet(store.sets[1].id, { title: "S3" });
      addSongToSet(store.sets[1].id, { title: "S4" });
      sanitizeEncoreMarkers();
      expect(hasEncoreMarker(store.sets[0])).toBe(false);
      expect(hasEncoreMarker(store.sets[1])).toBe(true);
    });
  });

  describe("set metrics", () => {
    it("should track longest entry", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "Short" });
      addSongToSet(set.id, { title: "A Much Longer Song Title" });
      expect(set.metrics.longestEntryId).toBe(set.songs[1].id);
    });

    it("should track total rows excluding encore marker", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "Song 1" });
      addSongToSet(set.id, { title: "Song 2" });
      addSongToSet(set.id, { title: "Song 3" });
      sanitizeEncoreMarkers();
      // 3 songs + encore marker, but metrics should count 3 playable songs
      expect(set.metrics.totalRows).toBe(3);
    });

    it("should update metrics on song update", () => {
      const set = store.sets[0];
      addSongToSet(set.id, { title: "Short" });
      addSongToSet(set.id, { title: "Medium Title" });
      const firstId = set.songs[0].id;
      updateSong(set.id, firstId, {
        title: "This Is Now The Longest Title In The Set",
      });
      expect(set.metrics.longestEntryId).toBe(firstId);
    });
  });
});
