import { describe, it, expect } from "vitest";
import {
  CM_TO_PX,
  TARGET_HEIGHT_CM,
  TARGET_WIDTH_CM,
  MARGINS_CM,
  BOX_HEIGHT_CM,
  BOX_WIDTH_CM,
  TARGET_WIDTH_PX,
  TARGET_HEIGHT_PX,
  BASE_FONT_SIZE_PX,
  MIN_FONT_SIZE_PX,
  MIN_LINE_HEIGHT,
  MAX_LINE_HEIGHT,
  DEFAULT_FONT_FAMILY,
  STORAGE_KEYS,
} from "../constants";

describe("constants", () => {
  describe("page dimensions", () => {
    it("should have correct CM_TO_PX conversion factor", () => {
      // 1 inch = 2.54 cm, 1 inch = 96 px (standard CSS)
      // 1 cm ≈ 37.795 px
      expect(CM_TO_PX).toBeCloseTo(37.795, 2);
    });

    it("should have A4 page height in cm", () => {
      expect(TARGET_HEIGHT_CM).toBe(29.7);
    });

    it("should have A4 page width in cm", () => {
      expect(TARGET_WIDTH_CM).toBe(21.0);
    });
  });

  describe("page margins", () => {
    it("should have 1cm margins on all sides", () => {
      expect(MARGINS_CM.top).toBe(1);
      expect(MARGINS_CM.bottom).toBe(1);
      expect(MARGINS_CM.left).toBe(1);
      expect(MARGINS_CM.right).toBe(1);
    });

    it("should be readonly", () => {
      // TypeScript enforces this at compile time with 'as const'
      // We verify the structure exists
      expect(Object.keys(MARGINS_CM)).toEqual(["top", "bottom", "left", "right"]);
    });
  });

  describe("computed dimensions", () => {
    it("should calculate BOX_HEIGHT_CM correctly", () => {
      const expected = TARGET_HEIGHT_CM - MARGINS_CM.top - MARGINS_CM.bottom;
      expect(BOX_HEIGHT_CM).toBe(expected);
      expect(BOX_HEIGHT_CM).toBe(27.7);
    });

    it("should calculate BOX_WIDTH_CM correctly", () => {
      const expected = TARGET_WIDTH_CM - MARGINS_CM.left - MARGINS_CM.right;
      expect(BOX_WIDTH_CM).toBe(expected);
      expect(BOX_WIDTH_CM).toBe(19.0);
    });

    it("should calculate TARGET_WIDTH_PX correctly", () => {
      const expected = TARGET_WIDTH_CM * CM_TO_PX;
      expect(TARGET_WIDTH_PX).toBeCloseTo(expected, 5);
    });

    it("should calculate TARGET_HEIGHT_PX correctly", () => {
      const expected = TARGET_HEIGHT_CM * CM_TO_PX;
      expect(TARGET_HEIGHT_PX).toBeCloseTo(expected, 5);
    });

    it("should have reasonable pixel dimensions for A4", () => {
      // A4 at 96 DPI is approximately 794 x 1123 pixels
      expect(TARGET_WIDTH_PX).toBeGreaterThan(790);
      expect(TARGET_WIDTH_PX).toBeLessThan(800);
      expect(TARGET_HEIGHT_PX).toBeGreaterThan(1120);
      expect(TARGET_HEIGHT_PX).toBeLessThan(1130);
    });
  });

  describe("font settings", () => {
    it("should have a reasonable base font size", () => {
      expect(BASE_FONT_SIZE_PX).toBe(16);
    });

    it("should have minimum font size less than base", () => {
      expect(MIN_FONT_SIZE_PX).toBeLessThan(BASE_FONT_SIZE_PX);
      expect(MIN_FONT_SIZE_PX).toBe(10);
    });

    it("should have valid line height range", () => {
      expect(MIN_LINE_HEIGHT).toBe(1.0);
      expect(MAX_LINE_HEIGHT).toBe(1.8);
      expect(MIN_LINE_HEIGHT).toBeLessThan(MAX_LINE_HEIGHT);
    });

    it("should have a valid font family stack", () => {
      expect(DEFAULT_FONT_FAMILY).toContain("Inter");
      expect(DEFAULT_FONT_FAMILY).toContain("sans-serif");
    });
  });

  describe("storage keys", () => {
    it("should have data storage key", () => {
      expect(STORAGE_KEYS.DATA).toBe("set-lister-data");
    });

    it("should have preview uppercase storage key", () => {
      expect(STORAGE_KEYS.PREVIEW_UPPERCASE).toBe("set-lister-preview-uppercase");
    });

    it("should have unique storage keys", () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
