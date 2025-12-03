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

  let longestStringPx = 0
  let fontSizePx = BASE_FONT_SIZE_PX
  let lineHeightPx = 0
  let lineHeight = BASE_LINE_HEIGHT

  for (const str of strings) {
    const span = document.createElement('span')
    span.style.fontSize = `${BASE_FONT_SIZE_PX}px`
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.style.padding = '0'
    span.style.margin = '0'
    span.textContent = str.trim()
    document.body.appendChild(span)

    const width = span.getBoundingClientRect().width
    lineHeightPx = span.getBoundingClientRect().height

    if (width > longestStringPx) {
      longestStringPx = width
    }

    document.body.removeChild(span)
  }
  const widthScale = boxWidth / longestStringPx
  fontSizePx = BASE_FONT_SIZE_PX * widthScale

  const totalTextHeightPx = lineHeightPx * strings.length * widthScale
  let remainingHeightPx = boxHeight - totalTextHeightPx
  console.log({ totalTextHeightPx, remainingHeightPx })

  while (remainingHeightPx < 0 && fontSizePx > 10) {
    fontSizePx -= 1
    const scale = fontSizePx / BASE_FONT_SIZE_PX
    const adjustedTextHeightPx = lineHeightPx * strings.length * scale
    remainingHeightPx = boxHeight - adjustedTextHeightPx
  }

  if (remainingHeightPx) {
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
