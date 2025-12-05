import { formatSongLabel } from "./textMetrics";

/**
 * Compute a font-size/line-height combo that keeps the supplied strings
 * within a bounding box measured in centimeters.
 *
 * The algorithm finds the optimal font size that maximizes text size while
 * ensuring all strings fit both horizontally and vertically within the box.
 * It uses DOM-based measurement for accurate results that match actual rendering.
 *
 * @param strings Strings to render (each entry is treated as a row)
 * @param boxWidthCm Width of the physical box in centimeters
 * @param boxHeightCm Height of the physical box in centimeters
 * @returns Object with a pixel `fontSize` and unitless `lineHeight`
 */
export function fitStringsToBox(
  strings: string[],
  boxWidthCm: number,
  boxHeightCm: number,
): {
  fontSizePx: number;
  lineHeight: number;
} {
  const BASE_FONT_SIZE_PX = 16;
  const MIN_FONT_SIZE_PX = 10;
  const MIN_LINE_HEIGHT = 1.0;
  const MAX_LINE_HEIGHT = 1.8;
  const CM_TO_PX = 37.795275591;

  const boxWidthPx = boxWidthCm * CM_TO_PX;
  const boxHeightPx = boxHeightCm * CM_TO_PX;

  if (strings.length === 0) {
    return {
      fontSizePx: BASE_FONT_SIZE_PX,
      lineHeight: MIN_LINE_HEIGHT,
    };
  }

  const numLines = strings.length;

  // Create a hidden DOM element to measure text dimensions accurately
  // This matches the actual rendering styles from SetPreview.vue
  const measureSpan = document.createElement("span");
  measureSpan.style.fontSize = `${BASE_FONT_SIZE_PX}px`;
  measureSpan.style.fontWeight = "600";
  measureSpan.style.fontFamily =
    "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";
  measureSpan.style.lineHeight = String(MIN_LINE_HEIGHT);
  measureSpan.style.visibility = "hidden";
  measureSpan.style.position = "absolute";
  measureSpan.style.whiteSpace = "nowrap";
  measureSpan.style.padding = "0";
  measureSpan.style.margin = "0";
  document.body.appendChild(measureSpan);

  // Measure each string to find the longest width and actual line height
  let maxWidthAtBase = 0;
  let actualLineHeightAtBase = BASE_FONT_SIZE_PX;

  for (const str of strings) {
    measureSpan.textContent = str.trim();
    const rect = measureSpan.getBoundingClientRect();
    maxWidthAtBase = Math.max(maxWidthAtBase, rect.width);
    // Get the actual rendered height - this accounts for font metrics
    if (rect.height > 0) {
      actualLineHeightAtBase = rect.height;
    }
  }

  document.body.removeChild(measureSpan);

  if (maxWidthAtBase === 0) {
    return {
      fontSizePx: BASE_FONT_SIZE_PX,
      lineHeight: MIN_LINE_HEIGHT,
    };
  }

  // The ratio of actual line height to font size at line-height: 1.0
  // This accounts for font metrics (ascenders, descenders, etc.)
  const lineHeightRatio = actualLineHeightAtBase / BASE_FONT_SIZE_PX;

  // Calculate the maximum font size based on width constraint
  const widthScale = boxWidthPx / maxWidthAtBase;
  const maxFontByWidth = BASE_FONT_SIZE_PX * widthScale;

  // Calculate the maximum font size based on height constraint
  // Each line actually takes: fontSize * lineHeightRatio * lineHeight
  // With MIN_LINE_HEIGHT, total height = fontSize * lineHeightRatio * MIN_LINE_HEIGHT * numLines
  // We need: fontSize * lineHeightRatio * MIN_LINE_HEIGHT * numLines <= boxHeightPx
  const maxFontByHeight =
    boxHeightPx / (lineHeightRatio * MIN_LINE_HEIGHT * numLines);

  // The optimal font size is the smaller of the two constraints
  let fontSizePx = Math.min(maxFontByWidth, maxFontByHeight);

  // Apply minimum font size constraint
  fontSizePx = Math.max(fontSizePx, MIN_FONT_SIZE_PX);

  // Calculate remaining vertical space
  const minTextHeightPx =
    fontSizePx * lineHeightRatio * MIN_LINE_HEIGHT * numLines;
  const remainingHeightPx = boxHeightPx - minTextHeightPx;

  // Distribute remaining vertical space as increased line height
  let lineHeight = MIN_LINE_HEIGHT;
  if (remainingHeightPx > 0 && numLines > 0) {
    // Extra height per line we can add
    const extraPerLine = remainingHeightPx / numLines;
    // Convert to line-height units (relative to fontSize * lineHeightRatio)
    lineHeight =
      MIN_LINE_HEIGHT + extraPerLine / (fontSizePx * lineHeightRatio);
    // Cap line height to prevent excessive spacing
    lineHeight = Math.min(lineHeight, MAX_LINE_HEIGHT);
  }

  return {
    fontSizePx,
    lineHeight,
  };
}

// Re-export formatSongLabel for convenience
export { formatSongLabel };
