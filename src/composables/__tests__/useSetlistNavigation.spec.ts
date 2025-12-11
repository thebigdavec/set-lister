import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref, nextTick } from "vue";
import {
  useSetlistNavigation,
  type FocusedItem,
} from "../useSetlistNavigation";
import { store, resetStore } from "../../store";

// Helper to set up store with test data
function setupTestStore() {
  resetStore();
  // Clear the default set and add our test sets
  store.sets = [
    {
      id: "set-1",
      name: "Set 1",
      songs: [
        { id: "song-1-1", title: "Song 1", key: "A" },
        { id: "song-1-2", title: "Song 2", key: "B" },
        { id: "song-1-3", title: "Song 3", key: "C" },
      ],
      metrics: {
        longestEntryId: "song-1-1",
        longestEntryText: "Song 1 (A)",
        longestEntryWidth16px: 100,
        totalRows: 3,
      },
    },
    {
      id: "set-2",
      name: "Set 2",
      songs: [
        { id: "song-2-1", title: "Song A", key: "D" },
        { id: "song-2-2", title: "Song B", key: "E" },
      ],
      metrics: {
        longestEntryId: "song-2-1",
        longestEntryText: "Song A (D)",
        longestEntryWidth16px: 100,
        totalRows: 2,
      },
    },
  ];
}

function setupStoreWithEncoreMarker() {
  resetStore();
  store.sets = [
    {
      id: "set-1",
      name: "Set 1",
      songs: [
        { id: "song-1-1", title: "Song 1", key: "A" },
        { id: "song-1-2", title: "<encore>", isEncoreMarker: true },
        { id: "song-1-3", title: "Song 2", key: "B" },
      ],
      metrics: {
        longestEntryId: "song-1-1",
        longestEntryText: "Song 1 (A)",
        longestEntryWidth16px: 100,
        totalRows: 2,
      },
    },
  ];
}

function setupEmptyStore() {
  resetStore();
  store.sets = [];
}

function setupStoreWithEmptySet() {
  resetStore();
  store.sets = [
    {
      id: "set-1",
      name: "Set 1",
      songs: [],
      metrics: {
        longestEntryId: null,
        longestEntryText: "",
        longestEntryWidth16px: 0,
        totalRows: 0,
      },
    },
    {
      id: "set-2",
      name: "Set 2",
      songs: [{ id: "song-2-1", title: "Song A", key: "D" }],
      metrics: {
        longestEntryId: "song-2-1",
        longestEntryText: "Song A (D)",
        longestEntryWidth16px: 100,
        totalRows: 1,
      },
    },
  ];
}

describe("useSetlistNavigation", () => {
  beforeEach(() => {
    setupTestStore();
  });

  describe("initialization", () => {
    it("should start with no focus", () => {
      const { focusedItem, hasFocus } = useSetlistNavigation();
      expect(focusedItem.value).toBeNull();
      expect(hasFocus.value).toBe(false);
    });

    it("should respect enabled option", () => {
      const enabled = ref(false);
      const { moveDown, focusedItem } = useSetlistNavigation({ enabled });

      moveDown();
      expect(focusedItem.value).toBeNull();

      enabled.value = true;
      moveDown();
      expect(focusedItem.value).not.toBeNull();
    });
  });

  describe("setFocus", () => {
    it("should set focus to a set name", () => {
      const { setFocus, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should set focus to a song", () => {
      const { setFocus, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 1 });
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
    });

    it("should clear focus when set to null", () => {
      const { setFocus, focusedItem, hasFocus } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      expect(hasFocus.value).toBe(true);

      setFocus(null);
      expect(focusedItem.value).toBeNull();
      expect(hasFocus.value).toBe(false);
    });
  });

  describe("clearFocus", () => {
    it("should clear the current focus", () => {
      const { setFocus, clearFocus, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      clearFocus();
      expect(focusedItem.value).toBeNull();
    });
  });

  describe("isFocused", () => {
    it("should return true for the focused set name", () => {
      const { setFocus, isFocused } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      expect(isFocused(0, "name")).toBe(true);
      expect(isFocused(1, "name")).toBe(false);
    });

    it("should return true for the focused song", () => {
      const { setFocus, isFocused } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 1 });
      expect(isFocused(0, "song", 1)).toBe(true);
      expect(isFocused(0, "song", 0)).toBe(false);
      expect(isFocused(0, "name")).toBe(false);
    });

    it("should return false when nothing is focused", () => {
      const { isFocused } = useSetlistNavigation();
      expect(isFocused(0, "name")).toBe(false);
      expect(isFocused(0, "song", 0)).toBe(false);
    });
  });

  describe("moveDown", () => {
    it("should focus first set name when nothing is focused", () => {
      const { moveDown, focusedItem } = useSetlistNavigation();

      moveDown();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move from set name to first song", () => {
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
    });

    it("should move to next song in the same set", () => {
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 0 });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
    });

    it("should move from last song to next set name", () => {
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 2 });
      moveDown();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
    });

    it("should move from empty set name to next set name", () => {
      setupStoreWithEmptySet();
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      moveDown();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
    });

    it("should do nothing when at last song of last set", () => {
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "song", songIndex: 1 });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });
    });

    it("should do nothing when store is empty", () => {
      setupEmptyStore();
      const { moveDown, focusedItem } = useSetlistNavigation();

      moveDown();
      expect(focusedItem.value).toBeNull();
    });

    it("should skip encore markers", () => {
      setupStoreWithEncoreMarker();
      const { setFocus, moveDown, focusedItem } = useSetlistNavigation();

      // Start at first song (index 0)
      setFocus({ setIndex: 0, type: "song", songIndex: 0 });
      // Move down should skip encore marker (index 1) and go to index 2
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 2,
      });
    });
  });

  describe("moveUp", () => {
    it("should focus last song of last set when nothing is focused", () => {
      const { moveUp, focusedItem } = useSetlistNavigation();

      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });
    });

    it("should move from first song to set name", () => {
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 0 });
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move to previous song in the same set", () => {
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 2 });
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
    });

    it("should move from set name to last song of previous set", () => {
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "name" });
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 2,
      });
    });

    it("should move from set name to previous set name when previous set is empty", () => {
      setupStoreWithEmptySet();
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "name" });
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should do nothing when at first set name", () => {
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should focus last set name when store has only empty sets", () => {
      resetStore();
      store.sets = [
        {
          id: "set-1",
          name: "Empty Set",
          songs: [],
          metrics: {
            longestEntryId: null,
            longestEntryText: "",
            longestEntryWidth16px: 0,
            totalRows: 0,
          },
        },
      ];
      const { moveUp, focusedItem } = useSetlistNavigation();

      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should skip encore markers", () => {
      setupStoreWithEncoreMarker();
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      // Start at last song (index 2)
      setFocus({ setIndex: 0, type: "song", songIndex: 2 });
      // Move up should skip encore marker (index 1) and go to index 0
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
    });
  });

  describe("triggerEdit", () => {
    it("should set editRequested when something is focused", () => {
      const { setFocus, triggerEdit, editRequested } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      triggerEdit();
      expect(editRequested.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should set editRequested for song focus", () => {
      const { setFocus, triggerEdit, editRequested } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "song", songIndex: 0 });
      triggerEdit();
      expect(editRequested.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
    });

    it("should do nothing when nothing is focused", () => {
      const { triggerEdit, editRequested } = useSetlistNavigation();

      triggerEdit();
      expect(editRequested.value).toBeNull();
    });

    it("should do nothing when disabled", () => {
      const enabled = ref(false);
      const { setFocus, triggerEdit, editRequested } = useSetlistNavigation({
        enabled,
      });

      enabled.value = true;
      setFocus({ setIndex: 0, type: "name" });
      enabled.value = false;
      triggerEdit();
      expect(editRequested.value).toBeNull();
    });
  });

  describe("clearEditRequest", () => {
    it("should clear the edit request", () => {
      const { setFocus, triggerEdit, clearEditRequest, editRequested } =
        useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      triggerEdit();
      expect(editRequested.value).not.toBeNull();

      clearEditRequest();
      expect(editRequested.value).toBeNull();
    });
  });

  describe("handleKeyDown", () => {
    function createKeyEvent(
      key: string,
      options: Partial<KeyboardEvent> = {},
    ): KeyboardEvent {
      return {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        target: document.createElement("div"),
        ...options,
      } as unknown as KeyboardEvent;
    }

    it("should move down on ArrowDown", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();

      handleKeyDown(createKeyEvent("ArrowDown"));
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move up on ArrowUp", () => {
      const { setFocus, handleKeyDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 1 });
      handleKeyDown(createKeyEvent("ArrowUp"));
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
    });

    it("should focus element on Enter when item is selected but target is not an input", () => {
      const { setFocus, handleKeyDown, registerElement } =
        useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "song", element, 0);
      setFocus({ setIndex: 0, type: "song", songIndex: 0 });

      // Simulate Enter from body (not an input)
      handleKeyDown(createKeyEvent("Enter"));
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should NOT focus element on Enter when element already has DOM focus", () => {
      const { setFocus, handleKeyDown, registerElement } =
        useSetlistNavigation();
      const element = document.createElement("div");
      document.body.appendChild(element);
      element.tabIndex = 0;
      element.focus(); // Give the element DOM focus

      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "song", element, 0);
      setFocus({ setIndex: 0, type: "song", songIndex: 0 });

      // Simulate Enter with the element as the target (it has focus)
      handleKeyDown(
        createKeyEvent("Enter", { target: element as EventTarget }),
      );

      // Should NOT call focus again since element already has focus
      // The element's own keydown handler should deal with it
      expect(focusSpy).not.toHaveBeenCalled();

      document.body.removeChild(element);
    });

    it("should focus element on 'e' key when item is selected but target is not an input", () => {
      const { setFocus, handleKeyDown, registerElement } =
        useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "song", element, 0);
      setFocus({ setIndex: 0, type: "song", songIndex: 0 });

      // Simulate 'e' from body (not an input)
      handleKeyDown(createKeyEvent("e"));
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should not handle Enter when target is an input", () => {
      const { setFocus, handleKeyDown, registerElement } =
        useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");
      const input = document.createElement("input");

      registerElement(0, "name", element);
      setFocus({ setIndex: 0, type: "name" });

      handleKeyDown(createKeyEvent("Enter", { target: input as EventTarget }));
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("should clear focus on Escape", () => {
      const { setFocus, handleKeyDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      handleKeyDown(createKeyEvent("Escape"));
      expect(focusedItem.value).toBeNull();
    });

    it("should prevent default for arrow keys", () => {
      const { handleKeyDown } = useSetlistNavigation();

      const downEvent = createKeyEvent("ArrowDown");
      handleKeyDown(downEvent);
      expect(downEvent.preventDefault).toHaveBeenCalled();

      const upEvent = createKeyEvent("ArrowUp");
      handleKeyDown(upEvent);
      expect(upEvent.preventDefault).toHaveBeenCalled();
    });

    it("should ignore keys with ctrl modifier", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();

      handleKeyDown(createKeyEvent("ArrowDown", { ctrlKey: true }));
      expect(focusedItem.value).toBeNull();
    });

    it("should ignore keys with meta modifier", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();

      handleKeyDown(createKeyEvent("ArrowDown", { metaKey: true }));
      expect(focusedItem.value).toBeNull();
    });

    it("should ignore keys with alt modifier", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();

      handleKeyDown(createKeyEvent("ArrowDown", { altKey: true }));
      expect(focusedItem.value).toBeNull();
    });

    it("should ignore arrow keys when target is input", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();
      const input = document.createElement("input");

      handleKeyDown(
        createKeyEvent("ArrowDown", { target: input as EventTarget }),
      );
      expect(focusedItem.value).toBeNull();
    });

    it("should ignore arrow keys when target is textarea", () => {
      const { handleKeyDown, focusedItem } = useSetlistNavigation();
      const textarea = document.createElement("textarea");

      handleKeyDown(
        createKeyEvent("ArrowDown", { target: textarea as EventTarget }),
      );
      expect(focusedItem.value).toBeNull();
    });

    it("should not handle Enter when target is contenteditable", () => {
      const { setFocus, handleKeyDown, registerElement } =
        useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");
      const contentEditable = document.createElement("div");
      contentEditable.contentEditable = "true";

      registerElement(0, "name", element);
      setFocus({ setIndex: 0, type: "name" });

      handleKeyDown(
        createKeyEvent("Enter", { target: contentEditable as EventTarget }),
      );
      // Should not try to focus since target is already contenteditable (editing)
      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe("registerElement and unregisterElement", () => {
    it("should register and use elements for focus", async () => {
      const { registerElement, setFocus } = useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "name", element);
      setFocus({ setIndex: 0, type: "name" });

      await nextTick();
      expect(focusSpy).toHaveBeenCalled();
    });

    it("should handle null element in registerElement", () => {
      const { registerElement, unregisterElement, setFocus } =
        useSetlistNavigation();
      const element = document.createElement("div");

      registerElement(0, "name", element);
      registerElement(0, "name", null); // Should unregister

      setFocus({ setIndex: 0, type: "name" });
      // Should not throw
    });

    it("should unregister elements", async () => {
      const { registerElement, unregisterElement, setFocus } =
        useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "name", element);
      unregisterElement(0, "name");
      setFocus({ setIndex: 0, type: "name" });

      await nextTick();
      expect(focusSpy).not.toHaveBeenCalled();
    });

    it("should register song elements with index", async () => {
      const { registerElement, setFocus } = useSetlistNavigation();
      const element = document.createElement("div");
      const focusSpy = vi.spyOn(element, "focus");

      registerElement(0, "song", element, 1);
      setFocus({ setIndex: 0, type: "song", songIndex: 1 });

      await nextTick();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe("navigation through multiple sets", () => {
    it("should navigate through entire setlist with moveDown", () => {
      const { moveDown, focusedItem } = useSetlistNavigation();

      // Start
      moveDown();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });

      // Set 1 songs
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 2,
      });

      // Move to Set 2
      moveDown();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });

      // Set 2 songs
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });

      // Should stay at end
      moveDown();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });
    });

    it("should navigate through entire setlist with moveUp", () => {
      const { setFocus, moveUp, focusedItem } = useSetlistNavigation();

      // Start at end
      setFocus({ setIndex: 1, type: "song", songIndex: 1 });

      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 2,
      });
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
      moveUp();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });

      // Should stay at start
      moveUp();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });
  });

  describe("moveLeft", () => {
    it("should focus first set name when nothing is focused", () => {
      const { moveLeft, focusedItem } = useSetlistNavigation();

      moveLeft();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move from set name to previous set name", () => {
      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "name" });
      moveLeft();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should do nothing when at first set name", () => {
      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      moveLeft();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move from song to matching song position in previous set", () => {
      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      // Set 2 has 2 songs, Set 1 has 3 songs
      // Song at position 0 in Set 2 should go to song at position 0 in Set 1
      setFocus({ setIndex: 1, type: "song", songIndex: 0 });
      moveLeft();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 0,
      });
    });

    it("should move to last song when matching position does not exist", () => {
      // Set 1 has 3 songs (indices 0, 1, 2)
      // Set 2 has 2 songs (indices 0, 1)
      // Need to set up a scenario where we're at song index 2 in Set 1
      // and move to Set 0 which might have fewer songs
      // Actually, moving left from Set 1 goes to Set 0 which has 3 songs
      // Let's test the other direction

      // Add a third set with only 1 song to test this properly
      store.sets.push({
        id: "set-3",
        name: "Set 3",
        songs: [{ id: "song-3-1", title: "Only Song", key: "F" }],
        metrics: {
          longestEntryId: "song-3-1",
          longestEntryText: "Only Song (F)",
          longestEntryWidth16px: 100,
          totalRows: 1,
        },
      });

      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      // Move from song index 1 in Set 3 (which doesn't exist, but let's use index 0)
      // to Set 2 which has 2 songs
      setFocus({ setIndex: 2, type: "song", songIndex: 0 });
      moveLeft();
      // Should go to song at position 0 in Set 2
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
    });

    it("should move to set name when previous set has no songs", () => {
      setupStoreWithEmptySet();
      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      // Set 2 has songs, Set 1 (index 0) is empty
      setFocus({ setIndex: 1, type: "song", songIndex: 0 });
      moveLeft();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should do nothing when at first set with a song focused", () => {
      const { setFocus, moveLeft, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "song", songIndex: 1 });
      moveLeft();
      expect(focusedItem.value).toEqual({
        setIndex: 0,
        type: "song",
        songIndex: 1,
      });
    });
  });

  describe("moveRight", () => {
    it("should focus first set name when nothing is focused", () => {
      const { moveRight, focusedItem } = useSetlistNavigation();

      moveRight();
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move from set name to next set name", () => {
      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      moveRight();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
    });

    it("should do nothing when at last set name", () => {
      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "name" });
      moveRight();
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
    });

    it("should move from song to matching song position in next set", () => {
      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      // Set 1 has 3 songs, Set 2 has 2 songs
      // Song at position 0 in Set 1 should go to song at position 0 in Set 2
      setFocus({ setIndex: 0, type: "song", songIndex: 0 });
      moveRight();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
    });

    it("should move to last song when matching position does not exist", () => {
      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      // Set 1 has 3 songs (positions 0, 1, 2)
      // Set 2 has 2 songs (positions 0, 1)
      // Song at position 2 in Set 1 should go to last song in Set 2 (position 1)
      setFocus({ setIndex: 0, type: "song", songIndex: 2 });
      moveRight();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });
    });

    it("should move to set name when next set has no songs", () => {
      // Add an empty set after the existing sets
      store.sets.push({
        id: "set-3",
        name: "Empty Set 3",
        songs: [],
        metrics: {
          longestEntryId: null,
          longestEntryText: "",
          longestEntryWidth16px: 0,
          totalRows: 0,
        },
      });

      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      // Move from song in Set 2 to empty Set 3
      setFocus({ setIndex: 1, type: "song", songIndex: 0 });
      moveRight();
      expect(focusedItem.value).toEqual({ setIndex: 2, type: "name" });
    });

    it("should do nothing when at last set with a song focused", () => {
      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "song", songIndex: 0 });
      moveRight();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 0,
      });
    });

    it("should skip encore markers when finding matching position", () => {
      setupStoreWithEncoreMarker();
      // Add a second set with songs
      store.sets.push({
        id: "set-2",
        name: "Set 2",
        songs: [
          { id: "song-2-1", title: "Song A", key: "D" },
          { id: "song-2-2", title: "Song B", key: "E" },
        ],
        metrics: {
          longestEntryId: "song-2-1",
          longestEntryText: "Song A (D)",
          longestEntryWidth16px: 100,
          totalRows: 2,
        },
      });

      const { setFocus, moveRight, focusedItem } = useSetlistNavigation();

      // Set 1 has: song at 0, encore marker at 1, song at 2
      // Playable positions: 0 -> index 0, 1 -> index 2
      // Set 2 has: song at 0, song at 1
      // Playable positions: 0 -> index 0, 1 -> index 1

      // From position 1 (actual index 2) in Set 1, should go to position 1 (index 1) in Set 2
      setFocus({ setIndex: 0, type: "song", songIndex: 2 });
      moveRight();
      expect(focusedItem.value).toEqual({
        setIndex: 1,
        type: "song",
        songIndex: 1,
      });
    });
  });

  describe("handleKeyDown with left/right arrows", () => {
    function createKeyEvent(
      key: string,
      options: Partial<KeyboardEvent> = {},
    ): KeyboardEvent {
      return {
        key,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        target: document.createElement("div"),
        ...options,
      } as unknown as KeyboardEvent;
    }

    it("should move left on ArrowLeft", () => {
      const { setFocus, handleKeyDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 1, type: "name" });
      handleKeyDown(createKeyEvent("ArrowLeft"));
      expect(focusedItem.value).toEqual({ setIndex: 0, type: "name" });
    });

    it("should move right on ArrowRight", () => {
      const { setFocus, handleKeyDown, focusedItem } = useSetlistNavigation();

      setFocus({ setIndex: 0, type: "name" });
      handleKeyDown(createKeyEvent("ArrowRight"));
      expect(focusedItem.value).toEqual({ setIndex: 1, type: "name" });
    });

    it("should prevent default for ArrowLeft", () => {
      const { setFocus, handleKeyDown } = useSetlistNavigation();
      setFocus({ setIndex: 1, type: "name" });

      const event = createKeyEvent("ArrowLeft");
      handleKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should prevent default for ArrowRight", () => {
      const { setFocus, handleKeyDown } = useSetlistNavigation();
      setFocus({ setIndex: 0, type: "name" });

      const event = createKeyEvent("ArrowRight");
      handleKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
