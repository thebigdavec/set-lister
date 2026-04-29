import { type Ref, computed } from "vue";
import { onKeyStroke } from "@vueuse/core";

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** The key to listen for (e.g., "s", "z", "Escape", "Enter") */
  key: string | string[];
  /** Handler function to execute */
  handler: (event: KeyboardEvent) => void;
  /** Whether Ctrl (or Cmd on Mac) must be pressed */
  ctrl?: boolean;
  /** Whether Alt must be pressed */
  alt?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Description of the shortcut (for documentation/tooltips) */
  description?: string;
  /** Whether to prevent default browser behavior (default: true for ctrl shortcuts) */
  preventDefault?: boolean;
}

/**
 * Options for useKeyboardShortcuts
 */
export interface UseKeyboardShortcutsOptions {
  /** Shortcuts active when in edit mode (default mode) */
  shortcuts: KeyboardShortcut[];
  /** Shortcuts active when in preview mode */
  previewShortcuts?: KeyboardShortcut[];
  /** Ref indicating if preview mode is active */
  isPreviewMode?: Ref<boolean>;
}

/**
 * Check if the event target is an input field where we should be careful
 * about triggering shortcuts
 */
function isInputField(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

/**
 * Check if modifier keys match the shortcut requirements
 */
function modifiersMatch(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
): boolean {
  const ctrlRequired = shortcut.ctrl ?? false;
  const altRequired = shortcut.alt ?? false;
  const shiftRequired = shortcut.shift ?? false;

  // Check Ctrl/Cmd (metaKey for Mac compatibility)
  const ctrlPressed = event.ctrlKey || event.metaKey;
  if (ctrlRequired !== ctrlPressed) return false;

  // Check Alt
  if (altRequired !== event.altKey) return false;

  // Check Shift
  if (shiftRequired !== event.shiftKey) return false;

  return true;
}

/**
 * Composable for declarative keyboard shortcut handling using VueUse's onKeyStroke.
 *
 * @example
 * ```ts
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: "s", ctrl: true, handler: () => save(), description: "Save" },
 *     { key: "z", ctrl: true, handler: () => undo(), description: "Undo" },
 *     { key: ["y", "Z"], ctrl: true, handler: () => redo(), description: "Redo" },
 *   ],
 *   previewShortcuts: [
 *     { key: "Escape", handler: () => closePreview(), description: "Close preview" },
 *   ],
 *   isPreviewMode: showPreview,
 * });
 * ```
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions,
): void {
  const { shortcuts, previewShortcuts = [], isPreviewMode } = options;

  // Determine which shortcuts are currently active
  const activeShortcuts = computed(() => {
    if (isPreviewMode?.value) {
      return previewShortcuts;
    }
    return shortcuts;
  });

  /**
   * Check if the pressed key matches the shortcut's key definition
   */
  function keyMatches(
    event: KeyboardEvent,
    shortcut: KeyboardShortcut,
  ): boolean {
    const keys = Array.isArray(shortcut.key) ? shortcut.key : [shortcut.key];
    // event.key gives us the actual character pressed (e.g., "s", "S", "Escape")
    // We do case-insensitive comparison for letter keys
    return keys.some((k) => k.toLowerCase() === event.key.toLowerCase());
  }

  // Create a handler that checks all active shortcuts
  function handleKeyStroke(event: KeyboardEvent): void {
    const currentShortcuts = activeShortcuts.value;

    for (const shortcut of currentShortcuts) {
      // Check if the pressed key matches this shortcut's key
      if (!keyMatches(event, shortcut)) continue;

      // Check if modifiers match
      if (!modifiersMatch(event, shortcut)) continue;

      // For non-modifier shortcuts, skip if we're in an input field
      if (!shortcut.ctrl && !shortcut.alt && isInputField(event)) continue;

      // Determine if we should prevent default
      const shouldPreventDefault =
        shortcut.preventDefault ?? shortcut.ctrl ?? false;

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      shortcut.handler(event);
      return; // Only handle first matching shortcut
    }
  }

  // Collect all unique keys from all shortcuts
  const allKeys = new Set<string>();
  for (const shortcut of [...shortcuts, ...previewShortcuts]) {
    const keys = Array.isArray(shortcut.key) ? shortcut.key : [shortcut.key];
    keys.forEach((k) => allKeys.add(k));
  }

  // Register a listener for each unique key
  for (const key of allKeys) {
    onKeyStroke(key, handleKeyStroke);
  }
}

// =============================================================================
// Shortcut Presets / Factories
// =============================================================================

/**
 * Handlers for common edit mode operations
 */
export interface EditModeHandlers {
  /** Start a new document */
  newDocument?: () => void;
  /** Save the current document */
  save?: () => void;
  /** Save the current document with a new name */
  saveAs?: () => void;
  /** Open/load a document */
  open?: () => void;
  /** Toggle preview mode */
  togglePreview?: () => void;
  /** Add a new set */
  addSet?: () => void;
  /** Undo the last action */
  undo?: () => void;
  /** Redo the last undone action */
  redo?: () => void;
  /** Print the document */
  print?: () => void;
}

/**
 * Create standard edit mode keyboard shortcuts.
 * Only includes shortcuts for handlers that are provided.
 */
export function createEditShortcuts(
  handlers: EditModeHandlers,
): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.newDocument) {
    shortcuts.push({
      key: "Enter",
      ctrl: true,
      handler: handlers.newDocument,
      description: "New Document (Ctrl+Enter)",
    });
  }

  if (handlers.save) {
    shortcuts.push({
      key: "s",
      ctrl: true,
      handler: handlers.save,
      description: "Save (Ctrl+S)",
    });
  }

  if (handlers.saveAs) {
    shortcuts.push({
      key: "s",
      ctrl: true,
      shift: true,
      handler: handlers.saveAs,
      description: "Save As (Ctrl+Shift+S)",
    });
  }

  if (handlers.open) {
    shortcuts.push({
      key: "o",
      ctrl: true,
      handler: handlers.open,
      description: "Open (Ctrl+O)",
    });
  }

  if (handlers.togglePreview) {
    shortcuts.push({
      key: "p",
      ctrl: true,
      handler: handlers.togglePreview,
      description: "Toggle Preview (Ctrl+P)",
    });
  }

  if (handlers.addSet) {
    shortcuts.push({
      key: "a",
      ctrl: true,
      shift: true,
      handler: handlers.addSet,
      description: "Add Set (Ctrl+Shift+A)",
    });
  }

  if (handlers.undo) {
    shortcuts.push({
      key: "z",
      ctrl: true,
      handler: handlers.undo,
      description: "Undo (Ctrl+Z)",
    });
  }

  if (handlers.redo) {
    shortcuts.push(
      {
        key: "y",
        ctrl: true,
        handler: handlers.redo,
        description: "Redo (Ctrl+Y)",
      },
      {
        key: "z",
        ctrl: true,
        shift: true,
        handler: handlers.redo,
        description: "Redo (Ctrl+Shift+Z)",
      },
    );
  }

  if (handlers.print) {
    shortcuts.push({
      key: "p",
      ctrl: true,
      shift: true,
      handler: handlers.print,
      description: "Print (Ctrl+Shift+P)",
    });
  }

  return shortcuts;
}

/**
 * Handlers for preview mode operations
 */
export interface PreviewModeHandlers {
  /** Close/exit preview mode */
  closePreview?: () => void;
  /** Print from preview */
  print?: () => void;
}

/**
 * Create standard preview mode keyboard shortcuts.
 * Only includes shortcuts for handlers that are provided.
 */
export function createPreviewShortcuts(
  handlers: PreviewModeHandlers,
): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.closePreview) {
    shortcuts.push({
      key: "Escape",
      handler: handlers.closePreview,
      description: "Close Preview (Escape)",
    });
  }

  if (handlers.print) {
    shortcuts.push({
      key: "p",
      ctrl: true,
      handler: handlers.print,
      description: "Print (Ctrl+P)",
    });
  }

  return shortcuts;
}
