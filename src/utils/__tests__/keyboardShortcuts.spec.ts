import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isMac,
  formatShortcut,
  getModifierSymbols,
  modifierSymbols,
} from "../keyboardShortcuts";

describe("keyboardShortcuts", () => {
  describe("isMac", () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should return true for Mac platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "MacIntel", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(true);
    });

    it("should return true for iPhone platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "iPhone", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(true);
    });

    it("should return true for iPad platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "iPad", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(true);
    });

    it("should return true for iPod platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "iPod", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(true);
    });

    it("should return false for Windows platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "Win32", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(false);
    });

    it("should return false for Linux platform", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "Linux x86_64", userAgent: "" },
        writable: true,
      });
      expect(isMac()).toBe(false);
    });

    it("should check userAgent if platform is empty", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        writable: true,
      });
      expect(isMac()).toBe(true);
    });
  });

  describe("modifierSymbols", () => {
    it("should have correct Mac symbols", () => {
      expect(modifierSymbols.mac.ctrl).toBe("⌘");
      expect(modifierSymbols.mac.alt).toBe("⌥");
      expect(modifierSymbols.mac.shift).toBe("⇧");
      expect(modifierSymbols.mac.separator).toBe("");
    });

    it("should have correct non-Mac symbols", () => {
      expect(modifierSymbols.other.ctrl).toBe("Ctrl+");
      expect(modifierSymbols.other.alt).toBe("Alt+");
      expect(modifierSymbols.other.shift).toBe("Shift+");
      expect(modifierSymbols.other.separator).toBe("");
    });
  });

  describe("getModifierSymbols", () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should return Mac symbols on Mac", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "MacIntel", userAgent: "" },
        writable: true,
      });
      expect(getModifierSymbols()).toBe(modifierSymbols.mac);
    });

    it("should return other symbols on Windows/Linux", () => {
      Object.defineProperty(global, "navigator", {
        value: { platform: "Win32", userAgent: "" },
        writable: true,
      });
      expect(getModifierSymbols()).toBe(modifierSymbols.other);
    });
  });

  describe("formatShortcut", () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    describe("on Mac", () => {
      beforeEach(() => {
        Object.defineProperty(global, "navigator", {
          value: { platform: "MacIntel", userAgent: "" },
          writable: true,
        });
      });

      it("should format Ctrl+S as ⌘S", () => {
        expect(formatShortcut("s", { ctrl: true })).toBe("⌘S");
      });

      it("should format Ctrl+Shift+S as ⇧⌘S", () => {
        expect(formatShortcut("s", { ctrl: true, shift: true })).toBe("⇧⌘S");
      });

      it("should format Ctrl+Alt+N as ⌥⌘N", () => {
        expect(formatShortcut("n", { ctrl: true, alt: true })).toBe("⌥⌘N");
      });

      it("should format Ctrl+Alt+Shift+X as ⇧⌥⌘X", () => {
        expect(formatShortcut("x", { ctrl: true, alt: true, shift: true })).toBe("⇧⌥⌘X");
      });

      it("should uppercase the key", () => {
        expect(formatShortcut("z", { ctrl: true })).toBe("⌘Z");
      });

      it("should handle key without modifiers", () => {
        expect(formatShortcut("Escape")).toBe("ESCAPE");
      });
    });

    describe("on Windows/Linux", () => {
      beforeEach(() => {
        Object.defineProperty(global, "navigator", {
          value: { platform: "Win32", userAgent: "" },
          writable: true,
        });
      });

      it("should format Ctrl+S as Ctrl+S", () => {
        expect(formatShortcut("s", { ctrl: true })).toBe("Ctrl+S");
      });

      it("should format Ctrl+Shift+S as Ctrl+Shift+S", () => {
        expect(formatShortcut("s", { ctrl: true, shift: true })).toBe("Ctrl+Shift+S");
      });

      it("should format Ctrl+Alt+N as Ctrl+Alt+N", () => {
        expect(formatShortcut("n", { ctrl: true, alt: true })).toBe("Ctrl+Alt+N");
      });

      it("should format Ctrl+Alt+Shift+X as Ctrl+Alt+Shift+X", () => {
        expect(formatShortcut("x", { ctrl: true, alt: true, shift: true })).toBe("Ctrl+Alt+Shift+X");
      });

      it("should uppercase the key", () => {
        expect(formatShortcut("z", { ctrl: true })).toBe("Ctrl+Z");
      });

      it("should handle key without modifiers", () => {
        expect(formatShortcut("Escape")).toBe("ESCAPE");
      });

      it("should format Alt+F4 correctly", () => {
        expect(formatShortcut("F4", { alt: true })).toBe("Alt+F4");
      });

      it("should format Shift+Tab correctly", () => {
        expect(formatShortcut("Tab", { shift: true })).toBe("Shift+TAB");
      });
    });
  });
});
