type AutoScaleOptions = {
  debug?: boolean
  stepDelayMs?: number
}

function getSiblingReservedHeight(element: HTMLElement): number {
  const parent = element.parentElement
  if (!parent) return 0

  let total = 0
  parent.childNodes.forEach(node => {
    if (node === element || node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    total += el.offsetHeight
    const styles = window.getComputedStyle(el)
    total +=
      parseFloat(styles.marginTop || '0') +
      parseFloat(styles.marginBottom || '0')
  })

  return total
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function autoScaleText(
  songsEl: HTMLElement | null,
  targetHeight: number,
  targetWidth: number,
  options?: AutoScaleOptions
): Promise<void> {
  if (!songsEl || targetHeight <= 0 || targetWidth <= 0) return
  const debug = Boolean(options?.debug)
  const stepDelay = options?.stepDelayMs ?? (debug ? 150 : 0)

  const ensureDebugPanel = (): HTMLDivElement => {
    let panel = document.getElementById('autoscale-debug') as HTMLDivElement | null
    if (!panel) {
      panel = document.createElement('div')
      panel.id = 'autoscale-debug'
      panel.style.position = 'fixed'
      panel.style.bottom = '16px'
      panel.style.left = '16px'
      panel.style.maxWidth = '420px'
      panel.style.maxHeight = '240px'
      panel.style.overflowY = 'auto'
      panel.style.background = 'rgba(0, 0, 0, 0.8)'
      panel.style.color = '#f4f4f4'
      panel.style.fontSize = '12px'
      panel.style.lineHeight = '1.4'
      panel.style.padding = '12px'
      panel.style.zIndex = '9999'
      panel.style.borderRadius = '8px'
      panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)'
      panel.style.fontFamily = 'Menlo, monospace'
      document.body.appendChild(panel)
    }
    return panel
  }

  const panel = debug ? ensureDebugPanel() : null
  const section = panel ? document.createElement('div') : null
  if (panel && section) {
    section.style.borderTop = panel.childElementCount ? '1px solid rgba(255,255,255,0.2)' : 'none'
    section.style.paddingTop = '6px'
    section.style.marginTop = '6px'
    panel.appendChild(section)
  }

  const log = (message: string) => {
    console.log(message)
    if (!section) return
    const row = document.createElement('div')
    row.textContent = message
    section.appendChild(row)
  }

  // Clear inline overrides so measurements are accurate on the real element
  songsEl.style.fontSize = ''
  songsEl.style.lineHeight = ''
  songsEl.style.transform = ''
  songsEl.style.transformOrigin = ''
  songsEl.style.width = ''

  const computed = window.getComputedStyle(songsEl)
  const paddingX =
    parseFloat(computed.paddingLeft || '0') +
    parseFloat(computed.paddingRight || '0')
  const paddingY =
    parseFloat(computed.paddingTop || '0') +
    parseFloat(computed.paddingBottom || '0')
  const reservedHeight = getSiblingReservedHeight(songsEl)

  const parentHeight = songsEl.parentElement?.clientHeight ?? targetHeight
  const effectiveTargetHeight = Math.min(
    parentHeight || targetHeight,
    targetHeight
  )

  const availableWidth = Math.max(targetWidth - paddingX, 50)
  const availableHeight = Math.max(
    effectiveTargetHeight - reservedHeight - paddingY,
    50
  )

  // Ensure live element uses the measured width while we explore sizes
  songsEl.style.width = `${availableWidth}px`

  log(`Target: ${targetWidth.toFixed(1)}w x ${targetHeight.toFixed(1)}h`)
  log(`Reserved height (header/footer): ${reservedHeight.toFixed(1)}`)
  log(`Available: ${availableWidth.toFixed(1)}w x ${availableHeight.toFixed(1)}h`)

  const baseFontSize = parseFloat(computed.fontSize || '16') || 16
  const normalLineHeight =
    computed.lineHeight === 'normal'
      ? 1.2
      : parseFloat(computed.lineHeight) || 1.2
  const minLineHeightForWidth = 0.3
  const targetLineHeight = Math.min(Math.max(normalLineHeight, minLineHeightForWidth), 3)

  // Measure with an off-DOM clone so flex sizing does not inflate scrollHeight
  const clone = songsEl.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.left = '-9999px'
  clone.style.top = '-9999px'
  clone.style.width = `${availableWidth}px`
  clone.style.maxWidth = `${availableWidth}px`
  clone.style.flex = '0 0 auto'
  clone.style.height = 'auto'
  clone.style.transform = ''
  clone.style.transformOrigin = ''

  document.body.appendChild(clone)

  const measureRows = () => {
    const songRows = Array.from(
      clone.querySelectorAll<HTMLElement>('.preview-song, .song-row, .song-item')
    )
    const maxRowWidth = songRows.reduce((max, row) => Math.max(max, row.scrollWidth), clone.scrollWidth)
    const totalHeight = clone.scrollHeight
    return { maxRowWidth, totalHeight }
  }

  // Phase 1: width-limited search using minimal line-height to avoid wrap influence
  let minSize = Math.max(10, Math.floor(baseFontSize * 0.8))
  let maxSize = Math.max(minSize, Math.floor(baseFontSize * 8))
  let optimalWidthSize = minSize
  let guard = 0

  while (minSize <= maxSize && guard < 50) {
    const midSize = Math.floor((minSize + maxSize) / 2)
    log(`Width check: ${midSize}px (range ${minSize}-${maxSize})`)

    clone.style.fontSize = `${midSize}px`
    clone.style.lineHeight = minLineHeightForWidth.toString()
    songsEl.style.fontSize = `${midSize}px`
    songsEl.style.lineHeight = minLineHeightForWidth.toString()

    const { maxRowWidth } = measureRows()
    const fitsWidth = maxRowWidth <= availableWidth

    log(
      `  width phase => max row width ${maxRowWidth}px <= ${availableWidth}px ? ${fitsWidth}`
    )

    if (fitsWidth) {
      optimalWidthSize = midSize
      minSize = midSize + 1
    } else {
      maxSize = midSize - 1
    }

    guard += 1

    if (stepDelay > 0) {
      await sleep(stepDelay)
    }
  }

  log(`Chosen width-limited font size: ${optimalWidthSize}px`)

  // Phase 2: height fitting with capped line-height, not exceeding width-limited size
  minSize = Math.max(8, Math.floor(baseFontSize * 0.75))
  maxSize = optimalWidthSize
  guard = 0
  let optimalSize = minSize

  while (minSize <= maxSize && guard < 50) {
    const midSize = Math.floor((minSize + maxSize) / 2)
    log(`Height check: ${midSize}px (range ${minSize}-${maxSize})`)

    clone.style.fontSize = `${midSize}px`
    clone.style.lineHeight = targetLineHeight.toString()
    songsEl.style.fontSize = `${midSize}px`
    songsEl.style.lineHeight = targetLineHeight.toString()

    const { maxRowWidth, totalHeight } = measureRows()
    const fitsWidth = maxRowWidth <= availableWidth
    const fitsHeight = totalHeight <= availableHeight

    log(
      `  height phase => max row width ${maxRowWidth}px <= ${availableWidth}px ? ${fitsWidth}, total height ${totalHeight}px <= ${availableHeight}px ? ${fitsHeight}`
    )

    if (fitsHeight && fitsWidth) {
      optimalSize = midSize
      minSize = midSize + 1
    } else {
      maxSize = midSize - 1
    }

    guard += 1

    if (stepDelay > 0) {
      await sleep(stepDelay)
    }
  }

  log(`Final font size after height phase: ${optimalSize}px`)

  // Apply best size to real element
  songsEl.style.fontSize = `${optimalSize}px`
  songsEl.style.lineHeight = targetLineHeight.toString()
  songsEl.style.width = `${availableWidth}px`

  // Fallback scaling if still overflowing
  const overflows =
    songsEl.scrollHeight > availableHeight ||
    songsEl.scrollWidth > availableWidth

  if (overflows) {
    const scaleWidth = availableWidth / songsEl.scrollWidth
    const scaleHeight = availableHeight / songsEl.scrollHeight
    const scale = Math.min(scaleWidth, scaleHeight, 1)

    songsEl.style.transformOrigin = 'top left'
    songsEl.style.transform = `scale(${scale})`
    log(`Applied fallback scale=${scale.toFixed(3)}`)
  } else {
    log('No fallback scale needed')
  }

  document.body.removeChild(clone)
}
