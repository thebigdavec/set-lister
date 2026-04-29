import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatSongLabel,
  measureTextWidth,
  measureSongLabelWidth,
} from "../textMetrics";

describe("textMetrics", () => {
  describe("formatSongLabel", () => {
    it("should format title without key", () => {
      expect(formatSongLabel("My Song")).toBe("My Song");
    });

    it("should format title with key", () => {
      expect(formatSongLabel("My Song", "Am")).toBe("My Song (Am)");
    });

    it("should trim whitespace from title", () => {
      expect(formatSongLabel("  My Song  ")).toBe("My Song");
    });

    it("should trim whitespace from key", () => {
      expect(formatSongLabel("My Song", "  G  ")).toBe("My Song (G)");
    });

    it("should return 'Untitled Song' for empty title", () => {
      expect(formatSongLabel("")).toBe("Untitled Song");
    });

    it("should return 'Untitled Song' for whitespace-only title", () => {
      expect(formatSongLabel("   ")).toBe("Untitled Song");
    });

    it("should ignore empty key", () => {
      expect(formatSongLabel("My Song", "")).toBe("My Song");
    });

    it("should ignore whitespace-only key", () => {
      expect(formatSongLabel("My Song", "   ")).toBe("My Song");
    });

    it("should handle undefined key", () => {
      expect(formatSongLabel("My Song", undefined)).toBe("My Song");
    });

    it("should handle 'Untitled Song' with key", () => {
      expect(formatSongLabel("", "Em")).toBe("Untitled Song (Em)");
    });
  });

  describe("measureTextWidth", () => {
    it("should return 0 for empty string", () => {
      expect(measureTextWidth("")).toBe(0);
    });

    it("should return a positive number for non-empty text", () => {
      const width = measureTextWidth("Hello World");
      expect(width).toBeGreaterThan(0);
    });

    it("should return larger width for longer text", () => {
      const shortWidth = measureTextWidth("Hi");
      const longWidth = measureTextWidth("Hello World, this is a longer string");
      expect(longWidth).toBeGreaterThan(shortWidth);
    });

    it("should return larger width for larger font size", () => {
      const smallWidth = measureTextWidth("Test", 12);
      const largeWidth = measureTextWidth("Test", 24);
      expect(largeWidth).toBeGreaterThan(smallWidth);
    });

    it("should accept custom font weight", () => {
      // Just verify it doesn't throw with different weights
      const normalWidth = measureTextWidth("Test", 16, 400);
      const boldWidth = measureTextWidth("Test", 16, 700);
      expect(normalWidth).toBeGreaterThan(0);
      expect(boldWidth).toBeGreaterThan(0);
    });
  });

  describe("measureSongLabelWidth", () => {
    it("should measure formatted song label", () => {
      const labelWidth = measureSongLabelWidth("My Song", "Am");
      const directWidth = measureTextWidth("My Song (Am)");
      expect(labelWidth).toBe(directWidth);
    });

    it("should measure song label without key", () => {
      const labelWidth = measureSongLabelWidth("My Song");
      const directWidth = measureTextWidth("My Song");
      expect(labelWidth).toBe(directWidth);
    });

    it("should accept custom font size", () => {
      const smallWidth = measureSongLabelWidth("Test Song", undefined, 12);
      const largeWidth = measureSongLabelWidth("Test Song", undefined, 24);
      expect(largeWidth).toBeGreaterThan(smallWidth);
    });

    it("should handle empty title", () => {
      const width = measureSongLabelWidth("");
      const expectedWidth = measureTextWidth("Untitled Song");
      expect(width).toBe(expectedWidth);
    });
  });
});
