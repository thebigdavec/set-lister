import { onMounted, onUnmounted, type Ref } from "vue";

/**
 * Key binding definition
 */
export interface KeyBinding {
  /** The key code (e.g., "KeyS", "KeyN", "Escape") */
  code: string;
  /** Handler function to execute */
  handler: () => void;
  /** Whether Ctrl/Cmd must be pressed (default: false) */
  ctrl?: boolean;
  /** Whether Alt must be pressed (default: false) */
  alt?: boolean;
  /** Whether Shift must be pressed (default: false) */
  shift?: boolean;
  /** Description of the shortcut (for documentation) */
  description?: string;
}

/**
 * Options for useKeyboardShortcuts
 */
export interface KeyboardShortcutsOptions {
  /** Bindings active when preview mode is enabled */
  previewBindings?: KeyBinding[];
  /** Bindings active when in edit mode (preview disabled) */
  editBindings?: KeyBinding[];
}

/**
 * Composable for declarative keyboard shortcut handling.
 * Supports different bindings for preview mode vs edit mode.
 *
 * @param showPreview - Ref indicating if preview mode is active
 * @param options - Key binding configurations
 */
export function useKeyboardShortcuts(
  showPreview: Ref<boolean>,
  options: KeyboardShortcutsOptions
) {
  const { previewBindings = [], editBindings = [] } = options;

  /**
   * Check if a key binding matches the current keyboard event
   */
  function matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
    // Check the key code
    if (event.code !== binding.code) return false;

    // Check modifiers
    const ctrlRequired = binding.ctrl ?? false;
    const altRequired = binding.alt ?? false;
    const shiftRequired = binding.shift ?? false;

    // For Ctrl bindings, we check on keyup of Control key
    // The event.ctrlKey will be false when Control is the key being released
    // So we need to handle this specially
    const isCtrlKeyUp = event.key === "Control";
    const ctrlPressed = isCtrlKeyUp || event.ctrlKey || event.metaKey;

    if (ctrlRequired && !ctrlPressed) return false;
    if (!ctrlRequired && ctrlPressed && !isCtrlKeyUp) return false;

    if (altRequired !== event.altKey) return false;
    if (shiftRequired !== event.shiftKey) return false;

    return true;
  }

  /**
   * Handle keyup events and dispatch to appropriate bindings
   */
  function handleKeyUp(event: KeyboardEvent): void {
    if (!event.key) return;

    const bindings = showPreview.value ? previewBindings : editBindings;

    // Special handling for Control key release with modifiers
    // When Control is released, we check if any other modifiers were held
    if (event.key === "Control") {
      for (const binding of bindings) {
        if (!binding.ctrl) continue;

        // Check if the binding's alt requirement matches
        if ((binding.alt ?? false) !== event.altKey) continue;
        if ((binding.shift ?? false) !== event.shiftKey) continue;

        // For ctrl bindings triggered on ctrl release, check the event.code
        // The code will be the last key pressed before ctrl was released
        // This matches the original behavior where ctrl+key shortcuts
        // fire on ctrl keyup, checking event.code for the key
        if (event.code === binding.code || binding.code === event.code) {
          // We need to track which keys were pressed with ctrl
          // For now, we'll rely on the original pattern where
          // ctrl shortcuts check event.code inside the Control case
        }
      }
    }

    for (const binding of bindings) {
      if (matchesBinding(event, binding)) {
        event.preventDefault();
        binding.handler();
        return;
      }
    }
  }

  /**
   * Alternative handler for the original keyup pattern
   * This matches the existing App.vue behavior more closely
   */
  function handleKeyUpLegacy(event: KeyboardEvent): void {
    if (!event.key) return;

    if (showPreview.value) {
      // Preview mode bindings
      for (const binding of previewBindings) {
        if (binding.code === "Escape" && event.key === "Escape") {
          binding.handler();
          return;
        }
      }
    } else {
      // Edit mode bindings - handle Control key release
      if (event.key === "Control") {
        for (const binding of editBindings) {
          if (!binding.ctrl) continue;

          const altRequired = binding.alt ?? false;
          if (altRequired !== event.altKey) continue;

          if (event.code === binding.code) {
            binding.handler();
            return;
          }
        }
      }
    }
  }

  onMounted(() => {
    window.addEventListener("keyup", handleKeyUpLegacy);
  });

  onUnmounted(() => {
    window.removeEventListener("keyup", handleKeyUpLegacy);
  });

  return {
    handleKeyUp: handleKeyUpLegacy,
  };
}

/**
 * Create common edit mode keyboard shortcuts
 */
export function createEditBindings(handlers: {
  startNew: () => void;
  saveToDisk: (event?: { altKey?: boolean }) => void;
  loadFromDisk: () => void;
  togglePreview: () => void;
  addSet: () => void;
}): KeyBinding[] {
  return [
    {
      code: "KeyN",
      ctrl: true,
      handler: handlers.startNew,
      description: "Start new set list",
    },
    {
      code: "KeyS",
      ctrl: true,
      handler: () => handlers.saveToDisk(),
      description: "Save set list",
    },
    {
      code: "KeyS",
      ctrl: true,
      alt: true,
      handler: () => handlers.saveToDisk({ altKey: true }),
      description: "Save set list as...",
    },
    {
      code: "KeyO",
      ctrl: true,
      handler: handlers.loadFromDisk,
      description: "Open set list",
    },
    {
      code: "KeyE",
      ctrl: true,
      handler: handlers.togglePreview,
      description: "Toggle print preview",
    },
    {
      code: "KeyN",
      ctrl: true,
      alt: true,
      handler: handlers.addSet,
      description: "Add new set",
    },
  ];
}

/**
 * Create common preview mode keyboard shortcuts
 */
export function createPreviewBindings(handlers: {
  closePreview: () => void;
}): KeyBinding[] {
  return [
    {
      code: "Escape",
      handler: handlers.closePreview,
      description: "Close preview",
    },
  ];
}
