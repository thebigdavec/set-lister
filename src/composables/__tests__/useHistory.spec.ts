import { describe, it, expect, beforeEach, vi } from "vitest";
import { nextTick } from "vue";
import { useHistory } from "../useHistory";
import {
  store,
  resetStore,
  addSet,
  addSongToSet,
  updateSong,
  removeSongFromSet,
  removeSet,
  renameSet,
  updateMetadata,
} from "../../store";

describe("useHistory", () => {
  beforeEach(() => {
    // Reset store to default state before each test
    resetStore();
  });

  describe("initialization", () => {
    it("should initialize with canUndo as false", () => {
      const { canUndo } = useHistory();
      expect(canUndo.value).toBe(false);
    });

    it("should initialize with canRedo as false", () => {
      const { canRedo } = useHistory();
      expect(canRedo.value).toBe(false);
    });

    it("should have undoCount of 0 initially", () => {
      const { undoCount } = useHistory();
      expect(undoCount.value).toBe(0);
    });
  });

  describe("tracking changes", () => {
    it("should track song additions", async () => {
      const { canUndo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Test Song", key: "C" });
      await nextTick();

      expect(canUndo.value).toBe(true);
    });

    it("should track set additions", async () => {
      const { canUndo } = useHistory();

      addSet();
      await nextTick();

      expect(canUndo.value).toBe(true);
    });

    it("should track metadata changes", async () => {
      const { canUndo } = useHistory();

      updateMetadata({ setListName: "My Set List" });
      await nextTick();

      expect(canUndo.value).toBe(true);
    });

    it("should track song updates", async () => {
      const { canUndo, clearHistory } = useHistory();

      // Add a song first
      addSongToSet(store.sets[0].id, { title: "Test Song", key: "C" });
      await nextTick();

      // Clear history so we can test just the update
      clearHistory();
      expect(canUndo.value).toBe(false);

      // Update the song
      const songId = store.sets[0].songs[0].id;
      updateSong(store.sets[0].id, songId, { title: "Updated Song" });
      await nextTick();

      expect(canUndo.value).toBe(true);
    });

    it("should track set renames", async () => {
      const { canUndo } = useHistory();

      renameSet(store.sets[0].id, "Renamed Set");
      await nextTick();

      expect(canUndo.value).toBe(true);
    });
  });

  describe("undo", () => {
    it("should undo song addition", async () => {
      const { undo } = useHistory();

      const setId = store.sets[0].id;
      expect(store.sets[0].songs.length).toBe(0);

      addSongToSet(setId, { title: "Test Song", key: "C" });
      await nextTick();
      expect(store.sets[0].songs.length).toBe(1);

      undo();
      await nextTick();

      expect(store.sets[0].songs.length).toBe(0);
    });

    it("should undo metadata change", async () => {
      const { undo } = useHistory();

      expect(store.metadata.setListName).toBe("");

      updateMetadata({ setListName: "My Set List" });
      await nextTick();
      expect(store.metadata.setListName).toBe("My Set List");

      undo();
      await nextTick();

      expect(store.metadata.setListName).toBe("");
    });

    it("should undo set addition", async () => {
      const { undo } = useHistory();

      expect(store.sets.length).toBe(1);

      addSet();
      await nextTick();
      expect(store.sets.length).toBe(2);

      undo();
      await nextTick();

      expect(store.sets.length).toBe(1);
    });

    it("should undo song removal", async () => {
      const { undo, clearHistory } = useHistory();

      const setId = store.sets[0].id;
      addSongToSet(setId, { title: "Test Song", key: "C" });
      await nextTick();

      clearHistory();
      const songId = store.sets[0].songs[0].id;

      removeSongFromSet(setId, songId);
      await nextTick();
      expect(store.sets[0].songs.length).toBe(0);

      undo();
      await nextTick();

      expect(store.sets[0].songs.length).toBe(1);
      expect(store.sets[0].songs[0].title).toBe("Test Song");
    });

    it("should do nothing when canUndo is false", async () => {
      const { undo, canUndo } = useHistory();

      expect(canUndo.value).toBe(false);
      const initialSetsLength = store.sets.length;

      undo();
      await nextTick();

      expect(store.sets.length).toBe(initialSetsLength);
    });

    it("should set isDirty to true after undo", async () => {
      const { undo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Test Song" });
      await nextTick();

      store.isDirty = false;
      undo();
      await nextTick();

      expect(store.isDirty).toBe(true);
    });
  });

  describe("redo", () => {
    it("should redo undone song addition", async () => {
      const { undo, redo } = useHistory();

      const setId = store.sets[0].id;
      addSongToSet(setId, { title: "Test Song", key: "C" });
      await nextTick();

      undo();
      await nextTick();
      expect(store.sets[0].songs.length).toBe(0);

      redo();
      await nextTick();

      expect(store.sets[0].songs.length).toBe(1);
      expect(store.sets[0].songs[0].title).toBe("Test Song");
    });

    it("should redo undone metadata change", async () => {
      const { undo, redo } = useHistory();

      updateMetadata({ venue: "Test Venue" });
      await nextTick();

      undo();
      await nextTick();
      expect(store.metadata.venue).toBe("");

      redo();
      await nextTick();

      expect(store.metadata.venue).toBe("Test Venue");
    });

    it("should enable canRedo after undo", async () => {
      const { undo, canRedo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Test Song" });
      await nextTick();
      expect(canRedo.value).toBe(false);

      undo();
      await nextTick();

      expect(canRedo.value).toBe(true);
    });

    it("should disable canRedo after new change", async () => {
      const { undo, canRedo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Test Song" });
      await nextTick();

      undo();
      await nextTick();
      expect(canRedo.value).toBe(true);

      // Make a new change
      addSongToSet(store.sets[0].id, { title: "Another Song" });
      await nextTick();

      expect(canRedo.value).toBe(false);
    });

    it("should do nothing when canRedo is false", async () => {
      const { redo, canRedo } = useHistory();

      expect(canRedo.value).toBe(false);
      const initialSetsLength = store.sets.length;

      redo();
      await nextTick();

      expect(store.sets.length).toBe(initialSetsLength);
    });

    it("should set isDirty to true after redo", async () => {
      const { undo, redo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Test Song" });
      await nextTick();

      undo();
      await nextTick();

      store.isDirty = false;
      redo();
      await nextTick();

      expect(store.isDirty).toBe(true);
    });
  });

  describe("clearHistory", () => {
    it("should clear all history", async () => {
      const { clearHistory, canUndo, canRedo, undoCount } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Song 1" });
      await nextTick();
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      await nextTick();

      expect(canUndo.value).toBe(true);

      clearHistory();

      expect(canUndo.value).toBe(false);
      expect(canRedo.value).toBe(false);
      expect(undoCount.value).toBe(0);
    });

    it("should reset history to current state after clear", async () => {
      const { clearHistory, undo, canUndo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Song 1" });
      await nextTick();

      clearHistory();

      // New change after clear
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      await nextTick();

      expect(canUndo.value).toBe(true);

      // Undo should only undo Song 2
      undo();
      await nextTick();

      expect(store.sets[0].songs.length).toBe(1);
      expect(store.sets[0].songs[0].title).toBe("Song 1");
    });
  });

  describe("multiple undo/redo", () => {
    it("should support multiple undos", async () => {
      const { undo, undoCount } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Song 1" });
      await nextTick();
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      await nextTick();
      addSongToSet(store.sets[0].id, { title: "Song 3" });
      await nextTick();

      expect(undoCount.value).toBe(3);
      // Account for auto-added encore marker
      const songsWithoutEncore = store.sets[0].songs.filter(
        (s) => !s.isEncoreMarker,
      );
      expect(songsWithoutEncore.length).toBe(3);

      undo();
      await nextTick();
      undo();
      await nextTick();

      const songsAfterUndo = store.sets[0].songs.filter(
        (s) => !s.isEncoreMarker,
      );
      expect(songsAfterUndo.length).toBe(1);
      expect(songsAfterUndo[0].title).toBe("Song 1");
    });

    it("should support multiple redos after multiple undos", async () => {
      const { undo, redo } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Song 1" });
      await nextTick();
      addSongToSet(store.sets[0].id, { title: "Song 2" });
      await nextTick();

      undo();
      await nextTick();
      undo();
      await nextTick();

      expect(store.sets[0].songs.length).toBe(0);

      redo();
      await nextTick();
      redo();
      await nextTick();

      // Account for encore marker that gets added with 2 songs
      const songsWithoutEncore = store.sets[0].songs.filter(
        (s) => !s.isEncoreMarker,
      );
      expect(songsWithoutEncore.length).toBe(2);
    });
  });

  describe("complex state changes", () => {
    it("should handle song title and key updates correctly", async () => {
      const { undo, clearHistory } = useHistory();

      addSongToSet(store.sets[0].id, { title: "Original Title", key: "C" });
      await nextTick();

      clearHistory();

      const songId = store.sets[0].songs[0].id;
      updateSong(store.sets[0].id, songId, {
        title: "New Title",
        key: "G",
      });
      await nextTick();

      expect(store.sets[0].songs[0].title).toBe("New Title");
      expect(store.sets[0].songs[0].key).toBe("G");

      undo();
      await nextTick();

      expect(store.sets[0].songs[0].title).toBe("Original Title");
      expect(store.sets[0].songs[0].key).toBe("C");
    });

    it("should handle multiple set operations", async () => {
      const { undo } = useHistory();

      addSet();
      await nextTick();
      addSet();
      await nextTick();

      expect(store.sets.length).toBe(3);

      undo();
      await nextTick();

      expect(store.sets.length).toBe(2);

      undo();
      await nextTick();

      expect(store.sets.length).toBe(1);
    });

    it("should handle combined metadata and set changes", async () => {
      const { undo } = useHistory();

      updateMetadata({ setListName: "My Gig", venue: "The Club" });
      await nextTick();
      addSongToSet(store.sets[0].id, { title: "Opening Song" });
      await nextTick();

      expect(store.metadata.setListName).toBe("My Gig");
      expect(store.sets[0].songs.length).toBe(1);

      undo();
      await nextTick();

      expect(store.metadata.setListName).toBe("My Gig");
      expect(store.sets[0].songs.length).toBe(0);

      undo();
      await nextTick();

      expect(store.metadata.setListName).toBe("");
      expect(store.metadata.venue).toBe("");
    });
  });
});
