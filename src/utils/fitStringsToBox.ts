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
  boxHeightCm: number
): {
  fontSizePx: number
  lineHeight: number
} {
  const BASE_FONT_SIZE_PX = 16
  const BASE_LINE_HEIGHT = 1.2
  const DPI = 96
  const CM_TO_INCH = 0.393701
  const boxWidth = boxWidthCm * CM_TO_INCH * DPI
  const boxHeight = boxHeightCm * CM_TO_INCH * DPI

  if (strings.length === 0) {
    return {
      fontSizePx: BASE_FONT_SIZE_PX,
      lineHeight: BASE_LINE_HEIGHT
    }
  }

  let longestStringPx = 0
  let lineHeightPx = BASE_FONT_SIZE_PX * BASE_LINE_HEIGHT

  const measureSpan = document.createElement('span')
  measureSpan.style.fontSize = `${BASE_FONT_SIZE_PX}px`
  measureSpan.style.visibility = 'hidden'
  measureSpan.style.position = 'absolute'
  measureSpan.style.padding = '0'
  measureSpan.style.margin = '0'
  document.body.appendChild(measureSpan)

  for (const str of strings) {
    measureSpan.textContent = str.trim()
    const rect = measureSpan.getBoundingClientRect()
    longestStringPx = Math.max(longestStringPx, rect.width)
    lineHeightPx = rect.height || lineHeightPx
  }

  document.body.removeChild(measureSpan)

  const widthScale = longestStringPx > 0 ? boxWidth / longestStringPx : 1
  let fontSizePx = BASE_FONT_SIZE_PX * widthScale

  const totalTextHeightPx = lineHeightPx * strings.length * widthScale
  let remainingHeightPx = boxHeight - totalTextHeightPx

  while (remainingHeightPx < 0 && fontSizePx > 10) {
    fontSizePx -= 1
    const scale = fontSizePx / BASE_FONT_SIZE_PX
    const adjustedTextHeightPx = lineHeightPx * strings.length * scale
    remainingHeightPx = boxHeight - adjustedTextHeightPx
  }

  let lineHeight = BASE_LINE_HEIGHT
  if (remainingHeightPx > 0) {
    const extraLineHeightPerLine =
      remainingHeightPx / (strings.length * (fontSizePx || 1))
    lineHeight += extraLineHeightPerLine
    lineHeight = Math.min(lineHeight, 2)
  }

  return {
    fontSizePx,
    lineHeight
  }
}
