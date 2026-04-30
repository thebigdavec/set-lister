import { formatSongLabel, measureSongLabelWidth } from '@/utils/textMetrics'
import type { Song, SetMetrics, SetItem } from './types'

const ENCORE_MARKER_TITLE = '<encore>'

const EMPTY_METRICS: SetMetrics = {
  longestEntryId: null,
  longestEntryText: '',
  longestEntryWidth16px: 0,
  totalRows: 0
}

export function cloneEmptyMetrics(): SetMetrics {
  return { ...EMPTY_METRICS }
}

function isEncoreMarkerSong(song: Song | undefined): boolean {
  if (!song) return false
  return song.isEncoreMarker === true || song.title === ENCORE_MARKER_TITLE
}

export function buildSetMetrics(songs: Song[]): SetMetrics {
  const filtered = songs.filter(song => !isEncoreMarkerSong(song))
  if (filtered.length === 0) {
    return cloneEmptyMetrics()
  }

  let longestEntryId: string | null = null
  let longestEntryText = ''
  let longestEntryWidth16px = 0

  filtered.forEach(song => {
    const label = formatSongLabel(song.title, song.key)
    const width = measureSongLabelWidth(song.title, song.key)
    if (width >= longestEntryWidth16px) {
      longestEntryWidth16px = width
      longestEntryText = label
      longestEntryId = song.id
    }
  })

  return {
    longestEntryId,
    longestEntryText,
    longestEntryWidth16px,
    totalRows: filtered.length
  }
}

export function applySongAdditionMetrics(set: SetItem, song: Song): void {
  if (isEncoreMarkerSong(song)) {
    set.metrics = buildSetMetrics(set.songs)
    return
  }
  const metrics = set.metrics ?? cloneEmptyMetrics()
  const label = formatSongLabel(song.title, song.key)
  const width = measureSongLabelWidth(song.title, song.key)
  const totalRows = set.songs.length

  if (!metrics.longestEntryId || width >= metrics.longestEntryWidth16px) {
    set.metrics = {
      longestEntryId: song.id,
      longestEntryText: label,
      longestEntryWidth16px: width,
      totalRows
    }
  } else {
    set.metrics = {
      ...metrics,
      totalRows
    }
  }
}

export function refreshSetMetrics(set: SetItem): void {
  set.metrics = buildSetMetrics(set.songs)
}
