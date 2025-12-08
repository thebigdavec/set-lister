import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fitStringsToBox } from "../fitStringsToBox";
import {
  BASE_FONT_SIZE_PX,
  MIN_FONT_SIZE_PX,
  MIN_LINE_HEIGHT,
  MAX_LINE_HEIGHT,
} from "../../constants";

describe("fitStringsToBox", () => {
  describe("edge cases", () => {
    it("should return base font size for empty array", () => {
      const result = fitStringsToBox([], 10, 10);
      expect(result.fontSizePx).toBe(BASE_FONT_SIZE_PX);
      expect(result.lineHeight).toBe(MIN_LINE_HEIGHT);
    });

    it("should handle single string", () => {
      const result = fitStringsToBox(["Hello"], 10, 10);
      expect(result.fontSizePx).toBeGreaterThan(0);
      expect(result.lineHeight).toBeGreaterThanOrEqual(MIN_LINE_HEIGHT);
    });

    it("should handle very small box dimensions", () => {
      const result = fitStringsToBox(["Very long string that won't fit"], 0.5, 0.5);
      // Should return at least minimum font size
      expect(result.fontSizePx).toBeGreaterThanOrEqual(MIN_FONT_SIZE_PX);
    });
  });

  describe("font size constraints", () => {
    it("should never go below minimum font size", () => {
      // Use a tiny box with many strings to force minimum
      const strings = Array(50).fill("A very long string that needs to shrink");
      const result = fitStringsToBox(strings, 1, 1);
      expect(result.fontSizePx).toBeGreaterThanOrEqual(MIN_FONT_SIZE_PX);
    });

    it("should reduce font size for longer strings", () => {
      const shortResult = fitStringsToBox(["Hi"], 5, 5);
      const longResult = fitStringsToBox(
        ["This is a much much longer string that takes more space"],
        5,
        5
      );
      expect(longResult.fontSizePx).toBeLessThanOrEqual(shortResult.fontSizePx);
    });

    it("should reduce font size for more strings", () => {
      const fewResult = fitStringsToBox(["A", "B"], 10, 10);
      const manyResult = fitStringsToBox(
        ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
        10,
        10
      );
      expect(manyResult.fontSizePx).toBeLessThanOrEqual(fewResult.fontSizePx);
    });
  });

  describe("line height constraints", () => {
    it("should have line height at least MIN_LINE_HEIGHT", () => {
      const result = fitStringsToBox(["Test"], 10, 10);
      expect(result.lineHeight).toBeGreaterThanOrEqual(MIN_LINE_HEIGHT);
    });

    it("should not exceed MAX_LINE_HEIGHT", () => {
      // Use a very tall box with few short strings
      const result = fitStringsToBox(["A"], 20, 50);
      expect(result.lineHeight).toBeLessThanOrEqual(MAX_LINE_HEIGHT);
    });

    it("should distribute vertical space via line height", () => {
      // Same strings, but more height should give more line height
      const tallResult = fitStringsToBox(["A", "B", "C"], 10, 20);
      const shortResult = fitStringsToBox(["A", "B", "C"], 10, 5);
      expect(tallResult.lineHeight).toBeGreaterThanOrEqual(shortResult.lineHeight);
    });
  });

  describe("box dimension handling", () => {
    it("should respect width constraint", () => {
      // Wider box should allow larger font
      const narrowResult = fitStringsToBox(["Test String"], 3, 10);
      const wideResult = fitStringsToBox(["Test String"], 15, 10);
      expect(wideResult.fontSizePx).toBeGreaterThanOrEqual(narrowResult.fontSizePx);
    });

    it("should respect height constraint", () => {
      // Taller box should allow larger font for many strings
      const shortResult = fitStringsToBox(
        ["A", "B", "C", "D", "E"],
        10,
        3
      );
      const tallResult = fitStringsToBox(
        ["A", "B", "C", "D", "E"],
        10,
        15
      );
      expect(tallResult.fontSizePx).toBeGreaterThanOrEqual(shortResult.fontSizePx);
    });
  });

  describe("whitespace handling", () => {
    it("should trim whitespace from strings", () => {
      const result = fitStringsToBox(["  Hello  ", "  World  "], 10, 10);
      expect(result.fontSizePx).toBeGreaterThan(0);
      expect(result.lineHeight).toBeGreaterThanOrEqual(MIN_LINE_HEIGHT);
    });

    it("should handle strings with only whitespace", () => {
      const result = fitStringsToBox(["   ", "   "], 10, 10);
      // Empty trimmed strings should still return valid values
      expect(result.fontSizePx).toBeGreaterThan(0);
    });
  });

  describe("return value structure", () => {
    it("should return object with fontSizePx and lineHeight", () => {
      const result = fitStringsToBox(["Test"], 10, 10);
      expect(result).toHaveProperty("fontSizePx");
      expect(result).toHaveProperty("lineHeight");
      expect(typeof result.fontSizePx).toBe("number");
      expect(typeof result.lineHeight).toBe("number");
    });

    it("should return finite numbers", () => {
      const result = fitStringsToBox(["Test"], 10, 10);
      expect(Number.isFinite(result.fontSizePx)).toBe(true);
      expect(Number.isFinite(result.lineHeight)).toBe(true);
    });
  });
});
