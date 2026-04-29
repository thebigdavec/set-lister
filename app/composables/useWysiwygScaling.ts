import { computed, nextTick, ref, type Ref } from 'vue'
import { fitStringsToBox } from '../utils/fitStringsToBox'
import { formatSongLabel } from '../utils/textMetrics'
import { BOX_HEIGHT_CM, BOX_WIDTH_CM, CM_TO_PX } from '../constants'
import { type SetItem, store } from '../stores/store'

export function useWysiwygScaling(
  setRef: Ref<SetItem>,
  isLastRef: Ref<boolean>
) {
  const contentRef = ref<HTMLElement | null>(null)
  const scaleFactor = ref<number>(1)
  const lineHeight = ref<string>('1.5')

  async function updateScaling() {
    await nextTick()
    if (!contentRef.value) return

    const set = setRef.value
    const strings = set.songs
      .map(song => {
        if (song.isEncoreMarker || song.title === '<encore>') {
          return '--------' // Estimate marker string length visually
        }
        return formatSongLabel(song.title, song.key) || ' '
      })
      .filter(Boolean)

    if (strings.length === 0) {
      scaleFactor.value = 16 /* Fallback pixel size */
      lineHeight.value = '1.5'
      return
    }

    // The wysiwyg-paper uses A4 inner box size (BOX_HEIGHT_CM).
    // We only need to subtract the encore actions footprint.
    const songListPaddingCm = 0
    // The FirstTimeHint in Set 1 takes up approximately 2cm
    const firstTimeHintCm =
      setRef.value.id === store.sets[0]?.id && set.songs.length > 0 ? 2.0 : 0
    const encoreHintCm = set.songs.length > 0 && isLastRef.value ? 1.5 : 0
    const usedHeightCm = songListPaddingCm + encoreHintCm + firstTimeHintCm
    const availableHeightCm = Math.max(0, BOX_HEIGHT_CM - usedHeightCm)

    const result = fitStringsToBox(strings, BOX_WIDTH_CM, availableHeightCm)

    // The fitStringsToBox returns a pixel font size based on A4 standard size (210mm wide).
    // We'll expose this directly as a px value so it scales dynamically when the paper itself is scaled.
    scaleFactor.value = result.fontSizePx
    lineHeight.value = result.lineHeight.toString()
  }

  return {
    contentRef,
    scaleFactor,
    lineHeight,
    updateScaling
  }
}
