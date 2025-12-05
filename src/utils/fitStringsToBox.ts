/**
 * Compute a font-size/line-height combo (based on a 16px baseline) that keeps
 * the supplied strings within a bounding box measured in centimeters.
 * It measures the longest string at the base size, scales it to fit the width,
 * then limits the result using the available vertical space.
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
  // Constants for font measurement and conversion
  const BASE_FONT_SIZE_PX = 16; // Reference font size for measurements
  const BASE_LINE_HEIGHT = 1; // Baseline line height multiplier
  const DPI = 96; // Standard screen DPI for pixel calculations
  const CM_TO_INCH = 0.393701; // Conversion factor from centimeters to inches

  // Convert physical dimensions to pixels for calculation
  const boxWidth = boxWidthCm * CM_TO_INCH * DPI;
  const boxHeight = boxHeightCm * CM_TO_INCH * DPI;

  // Handle edge case: no strings to measure
  if (strings.length === 0) {
    return {
      fontSizePx: BASE_FONT_SIZE_PX,
      lineHeight: BASE_LINE_HEIGHT,
    };
  }

  // Track the widest string and actual line height
  let longestStringPx = 0;
  let lineHeightPx = BASE_FONT_SIZE_PX * BASE_LINE_HEIGHT;

  // Create a hidden DOM element to measure text dimensions
  const measureSpan = document.createElement("span");
  measureSpan.style.fontSize = `${BASE_FONT_SIZE_PX}px`;
  measureSpan.style.visibility = "hidden"; // Hide from view but keep in layout
  measureSpan.style.position = "absolute"; // Remove from document flow
  measureSpan.style.padding = "0";
  measureSpan.style.margin = "0";
  document.body.appendChild(measureSpan);

  // Measure each string to find the longest width and actual line height
  for (const str of strings) {
    measureSpan.textContent = str.trim();
    const rect = measureSpan.getBoundingClientRect();
    longestStringPx = Math.max(longestStringPx, rect.width);
    lineHeightPx = rect.height || lineHeightPx; // Use actual height or fallback
  }

  // Clean up the temporary DOM element
  document.body.removeChild(measureSpan);

  // Calculate initial scaling based on width constraint
  // Scale font to fit the longest string within the box width
  const widthScale = longestStringPx > 0 ? boxWidth / longestStringPx : 1;
  let fontSizePx = BASE_FONT_SIZE_PX * widthScale;

  // Check if the scaled text fits vertically
  const totalTextHeightPx = lineHeightPx * strings.length * widthScale;
  let remainingHeightPx = boxHeight - totalTextHeightPx;

  // Reduce font size if text doesn't fit vertically
  // Keep minimum font size of 10px for readability
  while (remainingHeightPx < 0 && fontSizePx > 10) {
    fontSizePx -= 1;
    const scale = fontSizePx / BASE_FONT_SIZE_PX;
    const adjustedTextHeightPx = lineHeightPx * strings.length * scale;
    remainingHeightPx = boxHeight - adjustedTextHeightPx;
  }

  // Distribute any remaining vertical space as increased line height
  let lineHeight = BASE_LINE_HEIGHT;
  if (remainingHeightPx > 0) {
    // Calculate extra line height per line from remaining space
    const extraLineHeightPerLine =
      remainingHeightPx / (strings.length * (fontSizePx || 1));
    lineHeight += extraLineHeightPerLine;
    // Cap line height at 2.0 to prevent excessive spacing
    lineHeight = Math.min(lineHeight, 2);
  }

  return {
    fontSizePx,
    lineHeight,
  };
}
