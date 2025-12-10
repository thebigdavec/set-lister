import { computed, nextTick, ref, watch } from "vue";
import { useRefHistory } from "@vueuse/core";
import {
  store,
  type SetItem,
  type SetListMetadata,
  sanitizeEncoreMarkers,
} from "../store";

/**
 * Represents the trackable state for undo/redo operations.
 * This excludes isDirty as it's a derived state.
 */
interface HistoryState {
  metadata: SetListMetadata;
  sets: SetItem[];
}

/**
 * Deep clone function for history snapshots
 */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Composable for managing undo/redo history of the store state.
 * Uses VueUse's useRefHistory under the hood.
 */
export function useHistory() {
  // Create a ref that mirrors the relevant store state
  const historyState = ref<HistoryState>({
    metadata: deepClone(store.metadata),
    sets: deepClone(store.sets),
  });

  // Track whether we're currently applying a history change
  // to avoid triggering a new history entry during undo/redo
  const isApplyingHistory = ref(false);

  // Use VueUse's useRefHistory for the actual history tracking
  const {
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    clear,
    history,
    pause,
    resume,
  } = useRefHistory(historyState, {
    deep: true,
    capacity: 100, // Limit history to 100 entries
    clone: deepClone,
  });

  // Watch the store and sync changes to historyState
  // This creates new history entries when the store changes
  watch(
    () => ({
      metadata: store.metadata,
      sets: store.sets,
    }),
    (newValue) => {
      if (isApplyingHistory.value) return;

      historyState.value = {
        metadata: deepClone(newValue.metadata),
        sets: deepClone(newValue.sets),
      };
    },
    { deep: true },
  );

  /**
   * Apply a history state snapshot back to the store
   */
  function applyStateToStore(state: HistoryState): void {
    // Update metadata
    store.metadata.setListName = state.metadata.setListName;
    store.metadata.venue = state.metadata.venue;
    store.metadata.date = state.metadata.date;
    store.metadata.actName = state.metadata.actName;

    // Update sets - we need to replace the entire array
    store.sets.splice(0, store.sets.length, ...deepClone(state.sets));

    // Ensure encore markers are in valid state
    sanitizeEncoreMarkers();

    // Mark as dirty since we've changed state
    store.isDirty = true;
  }

  /**
   * Undo the last change
   */
  async function undo(): Promise<void> {
    if (!canUndo.value) return;

    // Set flag before undo to prevent the store watcher from creating new history
    isApplyingHistory.value = true;

    // Pause history tracking during the undo operation
    pause();

    historyUndo();
    applyStateToStore(historyState.value);

    // Wait for watchers to complete before resuming
    await nextTick();

    // Resume tracking without creating a new commit
    resume(false);
    isApplyingHistory.value = false;
  }

  /**
   * Redo the last undone change
   */
  async function redo(): Promise<void> {
    if (!canRedo.value) return;

    // Set flag before redo to prevent the store watcher from creating new history
    isApplyingHistory.value = true;

    // Pause history tracking during the redo operation
    pause();

    historyRedo();
    applyStateToStore(historyState.value);

    // Wait for watchers to complete before resuming
    await nextTick();

    // Resume tracking without creating a new commit
    resume(false);
    isApplyingHistory.value = false;
  }

  /**
   * Clear all history (useful when loading a new file or starting fresh)
   */
  function clearHistory(): void {
    clear();
    // Reset history state to current store state
    historyState.value = {
      metadata: deepClone(store.metadata),
      sets: deepClone(store.sets),
    };
  }

  /**
   * The number of undo steps available
   */
  const undoCount = computed(() => {
    // history includes current state, so available undos is length - 1
    return Math.max(0, history.value.length - 1);
  });

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    undoCount,
    history,
  };
}

export type UseHistoryReturn = ReturnType<typeof useHistory>;
