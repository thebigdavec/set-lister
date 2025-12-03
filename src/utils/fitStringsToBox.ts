export function fitStringsToBox(
  strings: string[],
  boxWidthCm: number,
  boxHeightCm: number
): {
  fontSize: number
  lineHeight: number
} {
  const BASE_FONT_SIZE_PX = 16
  const BASE_LINE_HEIGHT = 1.2
  const DPI = 72
  const CM_TO_INCH = 0.393701
  const boxWidth = boxWidthCm * CM_TO_INCH * DPI
  const boxHeight = boxHeightCm * CM_TO_INCH * DPI

  // Loop through stings to find the longest one
  let longestStringPx = 0

  for (const str of strings) {
    // create a temporary span element to measure text width
    const span = document.createElement('span')
    span.style.fontSize = `${BASE_FONT_SIZE_PX}px`
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.textContent = str
    document.body.appendChild(span)
    const width = span.getBoundingClientRect().width
    if (width > longestStringPx) {
      longestStringPx = width
    }
    document.body.removeChild(span)
  }

  // At this point we know the length of the longest
  // string in pixels at base font size.
  // Now we can calculate the optimal font-size for the width
  const widthScale = boxWidth / longestStringPx
  console.log(
    `Longest string width at base size: ${longestStringPx}px`,
    `Width scale is ${boxWidth} / ${longestStringPx} = ${widthScale}`
  )
  console.log(
    `At this point the font-size for the longest string is: ${Math.floor(
      BASE_FONT_SIZE_PX * widthScale
    )}px`
  )

  // the final line height in pixels is equal to the font size * base line height
  // So can almost certainly be calculated after width scaling using
  // the font size and the height of the box.
  const lineHeightPx = BASE_LINE_HEIGHT * BASE_FONT_SIZE_PX * widthScale

  // Calculate how many lines can fit in the box height
  const maxLines = boxHeight / lineHeightPx

  console.log(
    `Box height: ${boxHeight}px, line height: ${lineHeightPx}px, max lines: ${maxLines}`
  )

  // Now calculate the height scale based on number of strings and lineheightPx
  const totalTextHeight = strings.length * lineHeightPx
  const heightScale = boxHeight / totalTextHeight

  // The limiting factor is the smaller scale
  const finalScale = Math.min(widthScale, heightScale)

  const finalFontSize = Math.floor(BASE_FONT_SIZE_PX * finalScale)
  const finalLineHeight = Math.ceil(lineHeightPx / finalFontSize)

  return {
    fontSize: finalFontSize,
    lineHeight: finalLineHeight
  }
}
