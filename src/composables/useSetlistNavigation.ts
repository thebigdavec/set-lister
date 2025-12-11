import { ref, computed, type Ref, nextTick } from "vue";
import { store, isEncoreMarkerSong } from "../store";

/**
 * Represents a focusable item in the setlist
 */
export interface FocusedItem {
  /** Index of the set in the store */
  setIndex: number;
  /** Type of focused element: 'name' for set name, 'song' for a song item */
  type: "name" | "song";
  /** Index of the song within the set (only used when type is 'song') */
  songIndex?: number;
}

/**
 * Options for the useSetlistNavigation composable
 */
export interface UseSetlistNavigationOptions {
  /** Whether keyboard navigation is enabled */
  enabled?: Ref<boolean>;
}

/**
 * Return type for useSetlistNavigation
 */
export interface UseSetlistNavigationReturn {
  /** The currently focused item */
  focusedItem: Ref<FocusedItem | null>;
  /** Whether an item is currently focused */
  hasFocus: Ref<boolean>;
  /** Move focus up (previous song or set name) */
  moveUp: () => void;
  /** Move focus down (next song or next set name) */
  moveDown: () => void;
  /** Move focus left (to previous set, maintaining song position if possible) */
  moveLeft: () => void;
  /** Move focus right (to next set, maintaining song position if possible) */
  moveRight: () => void;
  /** Set focus to a specific item */
  setFocus: (item: FocusedItem | null) => void;
  /** Clear the current focus */
  clearFocus: () => void;
  /** Trigger edit mode for the currently focused item */
  triggerEdit: () => void;
  /** Check if a specific item is focused */
  isFocused: (
    setIndex: number,
    type: "name" | "song",
    songIndex?: number,
  ) => boolean;
  /** Handle keyboard event for navigation */
  handleKeyDown: (event: KeyboardEvent) => void;
  /** Register element refs for focus management */
  registerElement: (
    setIndex: number,
    type: "name" | "song",
    element: HTMLElement | null,
    songIndex?: number,
  ) => void;
  /** Unregister element refs */
  unregisterElement: (
    setIndex: number,
    type: "name" | "song",
    songIndex?: number,
  ) => void;
  /** Request edit for a specific item - components should listen to this */
  editRequested: Ref<FocusedItem | null>;
  /** Clear the edit request after handling */
  clearEditRequest: () => void;
}

/**
 * Get the number of playable (non-encore-marker) songs in a set
 */
function getPlayableSongCount(setIndex: number): number {
  const set = store.sets[setIndex];
  if (!set) return 0;
  return set.songs.filter((song) => !isEncoreMarkerSong(song)).length;
}

/**
 * Get the actual song index, skipping encore markers
 * Returns -1 if the index is out of bounds
 */
function getNextPlayableSongIndex(
  setIndex: number,
  currentIndex: number,
  direction: "up" | "down",
): number {
  const set = store.sets[setIndex];
  if (!set) return -1;

  const songs = set.songs;
  const step = direction === "down" ? 1 : -1;
  let index = currentIndex + step;

  while (index >= 0 && index < songs.length) {
    if (!isEncoreMarkerSong(songs[index])) {
      return index;
    }
    index += step;
  }

  return -1;
}

/**
 * Get the first playable song index in a set
 */
function getFirstPlayableSongIndex(setIndex: number): number {
  const set = store.sets[setIndex];
  if (!set) return -1;
  return set.songs.findIndex((song) => !isEncoreMarkerSong(song));
}

/**
 * Get the last playable song index in a set
 */
function getLastPlayableSongIndex(setIndex: number): number {
  const set = store.sets[setIndex];
  if (!set) return -1;

  for (let i = set.songs.length - 1; i >= 0; i--) {
    if (!isEncoreMarkerSong(set.songs[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Get all playable song indices in a set
 */
function getPlayableSongIndices(setIndex: number): number[] {
  const set = store.sets[setIndex];
  if (!set) return [];

  return set.songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) => !isEncoreMarkerSong(song))
    .map(({ index }) => index);
}

/**
 * Find the best matching song index in a target set.
 * Tries to match the same position in the playable songs list,
 * falling back to the last playable song if the position doesn't exist.
 */
function findMatchingSongIndex(
  sourceSetIndex: number,
  sourceSongIndex: number,
  targetSetIndex: number,
): number {
  const sourcePlayable = getPlayableSongIndices(sourceSetIndex);
  const targetPlayable = getPlayableSongIndices(targetSetIndex);

  if (targetPlayable.length === 0) return -1;

  // Find the position of the source song in the playable list
  const sourcePosition = sourcePlayable.indexOf(sourceSongIndex);
  if (sourcePosition === -1) {
    // Source song not found in playable list, return last playable in target
    return targetPlayable[targetPlayable.length - 1];
  }

  // Try to use the same position in target set
  if (sourcePosition < targetPlayable.length) {
    return targetPlayable[sourcePosition];
  }

  // Position doesn't exist in target, return last playable song
  return targetPlayable[targetPlayable.length - 1];
}

/**
 * Create a unique key for an element
 */
function getElementKey(
  setIndex: number,
  type: "name" | "song",
  songIndex?: number,
): string {
  return type === "name"
    ? `set-${setIndex}-name`
    : `set-${setIndex}-song-${songIndex}`;
}

/**
 * Composable for managing keyboard navigation in the setlist
 */
export function useSetlistNavigation(
  options: UseSetlistNavigationOptions = {},
): UseSetlistNavigationReturn {
  const { enabled = ref(true) } = options;

  const focusedItem = ref<FocusedItem | null>(null);
  const editRequested = ref<FocusedItem | null>(null);
  const elementRegistry = new Map<string, HTMLElement>();

  const hasFocus = computed(() => focusedItem.value !== null);

  function setFocus(item: FocusedItem | null): void {
    focusedItem.value = item;
    if (item) {
      nextTick(() => {
        // Check if focusedItem still matches what we intended to focus
        // This prevents stale callbacks from focusing wrong elements during rapid navigation
        const current = focusedItem.value;
        if (
          !current ||
          current.setIndex !== item.setIndex ||
          current.type !== item.type ||
          current.songIndex !== item.songIndex
        ) {
          return; // State has changed, skip this focus call
        }

        const key = getElementKey(item.setIndex, item.type, item.songIndex);
        const element = elementRegistry.get(key);
        if (element) {
          element.focus();
        }
      });
    }
  }

  function clearFocus(): void {
    focusedItem.value = null;
  }

  function isFocused(
    setIndex: number,
    type: "name" | "song",
    songIndex?: number,
  ): boolean {
    if (!focusedItem.value) return false;
    if (focusedItem.value.setIndex !== setIndex) return false;
    if (focusedItem.value.type !== type) return false;
    if (type === "song" && focusedItem.value.songIndex !== songIndex)
      return false;
    return true;
  }

  function moveUp(): void {
    if (!enabled.value) return;

    const current = focusedItem.value;
    const setsCount = store.sets.length;

    if (!current) {
      // Nothing focused, focus the last set's name or last song
      if (setsCount > 0) {
        const lastSetIndex = setsCount - 1;
        const lastSongIndex = getLastPlayableSongIndex(lastSetIndex);
        if (lastSongIndex >= 0) {
          setFocus({
            setIndex: lastSetIndex,
            type: "song",
            songIndex: lastSongIndex,
          });
        } else {
          setFocus({ setIndex: lastSetIndex, type: "name" });
        }
      }
      return;
    }

    if (current.type === "name") {
      // From set name, move to the last song of the previous set
      if (current.setIndex > 0) {
        const prevSetIndex = current.setIndex - 1;
        const lastSongIndex = getLastPlayableSongIndex(prevSetIndex);
        if (lastSongIndex >= 0) {
          setFocus({
            setIndex: prevSetIndex,
            type: "song",
            songIndex: lastSongIndex,
          });
        } else {
          // Previous set has no songs, focus its name
          setFocus({ setIndex: prevSetIndex, type: "name" });
        }
      }
      // If at first set name, do nothing (or could wrap around)
    } else if (current.type === "song" && current.songIndex !== undefined) {
      // From a song, try to move to the previous song
      const prevSongIndex = getNextPlayableSongIndex(
        current.setIndex,
        current.songIndex,
        "up",
      );
      if (prevSongIndex >= 0) {
        setFocus({
          setIndex: current.setIndex,
          type: "song",
          songIndex: prevSongIndex,
        });
      } else {
        // No previous song, focus the set name
        setFocus({ setIndex: current.setIndex, type: "name" });
      }
    }
  }

  function moveDown(): void {
    if (!enabled.value) return;

    const current = focusedItem.value;
    const setsCount = store.sets.length;

    if (!current) {
      // Nothing focused, focus the first set's name
      if (setsCount > 0) {
        setFocus({ setIndex: 0, type: "name" });
      }
      return;
    }

    if (current.type === "name") {
      // From set name, move to the first song of this set
      const firstSongIndex = getFirstPlayableSongIndex(current.setIndex);
      if (firstSongIndex >= 0) {
        setFocus({
          setIndex: current.setIndex,
          type: "song",
          songIndex: firstSongIndex,
        });
      } else {
        // No songs in this set, move to next set's name
        if (current.setIndex < setsCount - 1) {
          setFocus({ setIndex: current.setIndex + 1, type: "name" });
        }
      }
    } else if (current.type === "song" && current.songIndex !== undefined) {
      // From a song, try to move to the next song
      const nextSongIndex = getNextPlayableSongIndex(
        current.setIndex,
        current.songIndex,
        "down",
      );
      if (nextSongIndex >= 0) {
        setFocus({
          setIndex: current.setIndex,
          type: "song",
          songIndex: nextSongIndex,
        });
      } else {
        // No next song, move to next set's name
        if (current.setIndex < setsCount - 1) {
          setFocus({ setIndex: current.setIndex + 1, type: "name" });
        }
      }
    }
  }

  function moveLeft(): void {
    if (!enabled.value) return;

    const current = focusedItem.value;
    const setsCount = store.sets.length;

    if (!current) {
      // Nothing focused, focus the first set's name
      if (setsCount > 0) {
        setFocus({ setIndex: 0, type: "name" });
      }
      return;
    }

    // Can't move left from first set
    if (current.setIndex === 0) return;

    const targetSetIndex = current.setIndex - 1;

    if (current.type === "name") {
      // From set name, move to previous set's name
      setFocus({ setIndex: targetSetIndex, type: "name" });
    } else if (current.type === "song" && current.songIndex !== undefined) {
      // From a song, try to find matching song in previous set
      const matchingSongIndex = findMatchingSongIndex(
        current.setIndex,
        current.songIndex,
        targetSetIndex,
      );
      if (matchingSongIndex >= 0) {
        setFocus({
          setIndex: targetSetIndex,
          type: "song",
          songIndex: matchingSongIndex,
        });
      } else {
        // No songs in target set, focus its name
        setFocus({ setIndex: targetSetIndex, type: "name" });
      }
    }
  }

  function moveRight(): void {
    if (!enabled.value) return;

    const current = focusedItem.value;
    const setsCount = store.sets.length;

    if (!current) {
      // Nothing focused, focus the first set's name
      if (setsCount > 0) {
        setFocus({ setIndex: 0, type: "name" });
      }
      return;
    }

    // Can't move right from last set
    if (current.setIndex >= setsCount - 1) return;

    const targetSetIndex = current.setIndex + 1;

    if (current.type === "name") {
      // From set name, move to next set's name
      setFocus({ setIndex: targetSetIndex, type: "name" });
    } else if (current.type === "song" && current.songIndex !== undefined) {
      // From a song, try to find matching song in next set
      const matchingSongIndex = findMatchingSongIndex(
        current.setIndex,
        current.songIndex,
        targetSetIndex,
      );
      if (matchingSongIndex >= 0) {
        setFocus({
          setIndex: targetSetIndex,
          type: "song",
          songIndex: matchingSongIndex,
        });
      } else {
        // No songs in target set, focus its name
        setFocus({ setIndex: targetSetIndex, type: "name" });
      }
    }
  }

  function triggerEdit(): void {
    if (!enabled.value) return;
    if (!focusedItem.value) return;

    editRequested.value = { ...focusedItem.value };
  }

  function clearEditRequest(): void {
    editRequested.value = null;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!enabled.value) return;

    // Don't handle navigation when in input/textarea or when modifiers are pressed
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    // For arrow keys, handle navigation even from focusable elements
    // but not from input fields in edit mode
    if (
      isInput &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    ) {
      return;
    }

    // Don't interfere with keyboard shortcuts
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveUp();
        break;
      case "ArrowDown":
        event.preventDefault();
        moveDown();
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveLeft();
        break;
      case "ArrowRight":
        event.preventDefault();
        moveRight();
        break;
      case "Escape":
        clearFocus();
        break;
      case "Enter":
      case "e":
        // Handle Enter/e to trigger edit when:
        // - We have a focused item in navigation state
        // - The target is not an input/textarea/contenteditable (those handle it locally)
        // - The registered element does NOT already have DOM focus (to avoid double-handling)
        // This covers the case where an item is "selected" via navigation but doesn't have DOM focus
        if (focusedItem.value && !isInput) {
          const key = getElementKey(
            focusedItem.value.setIndex,
            focusedItem.value.type,
            focusedItem.value.songIndex,
          );
          const element = elementRegistry.get(key);

          // Only handle if the element doesn't already have DOM focus
          // If it has focus, let the element's own keydown handler deal with it
          if (element && document.activeElement !== element) {
            event.preventDefault();
            // Stop propagation to prevent the keydown event from reaching
            // the element's own handler after we focus it
            event.stopPropagation();
            // Focus the element - for contenteditable (set names), this enters edit mode
            element.focus();
            // For song items, we need to trigger edit mode since focus alone doesn't do it
            // We set a data attribute that the element can check, rather than dispatching
            // a synthetic event which causes double-handling issues
            if (focusedItem.value.type === "song") {
              element.dataset.triggerEdit = "true";
              // Use a microtask to let the focus settle, then trigger edit
              queueMicrotask(() => {
                const event = new CustomEvent("navigationEdit");
                element.dispatchEvent(event);
                delete element.dataset.triggerEdit;
              });
            }
          }
          // If element already has focus, do nothing - let local handler deal with it
        }
        break;
    }
  }

  function registerElement(
    setIndex: number,
    type: "name" | "song",
    element: HTMLElement | null,
    songIndex?: number,
  ): void {
    const key = getElementKey(setIndex, type, songIndex);
    if (element) {
      elementRegistry.set(key, element);
    } else {
      elementRegistry.delete(key);
    }
  }

  function unregisterElement(
    setIndex: number,
    type: "name" | "song",
    songIndex?: number,
  ): void {
    const key = getElementKey(setIndex, type, songIndex);
    elementRegistry.delete(key);
  }

  return {
    focusedItem,
    hasFocus,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    setFocus,
    clearFocus,
    triggerEdit,
    isFocused,
    handleKeyDown,
    registerElement,
    unregisterElement,
    editRequested,
    clearEditRequest,
  };
}
