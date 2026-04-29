/**
 * Utility functions for formatting keyboard shortcuts with OS-appropriate symbols
 */

/**
 * Detect if the user is on macOS
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/**
 * Modifier key symbols for different operating systems
 */
export const modifierSymbols = {
  mac: {
    ctrl: "⌘", // Command
    alt: "⌥", // Option
    shift: "⇧",
    separator: "",
  },
  other: {
    ctrl: "Ctrl+",
    alt: "Alt+",
    shift: "Shift+",
    separator: "",
  },
} as const;

/**
 * Get the appropriate modifier symbols for the current OS
 */
export function getModifierSymbols() {
  return isMac() ? modifierSymbols.mac : modifierSymbols.other;
}

/**
 * Format a keyboard shortcut for display with OS-appropriate symbols
 *
 * @param key - The main key (e.g., "S", "Z", "N")
 * @param options - Modifier options
 * @returns Formatted shortcut string (e.g., "⌘S" on Mac, "Ctrl+S" on Windows/Linux)
 *
 * @example
 * formatShortcut("S", { ctrl: true })
 * // Mac: "⌘S"
 * // Windows/Linux: "Ctrl+S"
 *
 * @example
 * formatShortcut("S", { ctrl: true, shift: true })
 * // Mac: "⇧⌘S"
 * // Windows/Linux: "Ctrl+Shift+S"
 *
 * @example
 * formatShortcut("N", { ctrl: true, alt: true })
 * // Mac: "⌥⌘N"
 * // Windows/Linux: "Ctrl+Alt+N"
 */
export function formatShortcut(
  key: string,
  options: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  } = {},
): string {
  const symbols = getModifierSymbols();
  const parts: string[] = [];

  // On Mac, the conventional order is: ⇧⌥⌘ (Shift, Option, Command)
  // On Windows/Linux, it's: Ctrl+Alt+Shift+
  if (isMac()) {
    if (options.shift) parts.push(symbols.shift);
    if (options.alt) parts.push(symbols.alt);
    if (options.ctrl) parts.push(symbols.ctrl);
  } else {
    if (options.ctrl) parts.push(symbols.ctrl);
    if (options.alt) parts.push(symbols.alt);
    if (options.shift) parts.push(symbols.shift);
  }

  parts.push(key.toUpperCase());

  return parts.join(symbols.separator);
}

/**
 * Common keyboard shortcuts formatted for the current OS
 */
export const shortcuts = {
  get newDocument() {
    return formatShortcut("Enter", { ctrl: true });
  },
  get open() {
    return formatShortcut("O", { ctrl: true });
  },
  get save() {
    return formatShortcut("S", { ctrl: true });
  },
  get saveAs() {
    return formatShortcut("S", { ctrl: true, shift: true });
  },
  get undo() {
    return formatShortcut("Z", { ctrl: true });
  },
  get redo() {
    return formatShortcut("Y", { ctrl: true });
  },
  get redoAlt() {
    return formatShortcut("Z", { ctrl: true, shift: true });
  },
  get print() {
    return formatShortcut("P", { ctrl: true });
  },
  get addSet() {
    return formatShortcut("A", { ctrl: true, shift: true });
  },
} as const;
