import type { Song, SetItem } from './types'

const ENCORE_MARKER_TITLE = '<encore>'

export function isEncoreMarkerSong(song: Song | undefined): boolean {
  if (!song) return false
  return song.isEncoreMarker === true || song.title === ENCORE_MARKER_TITLE
}

export function createEncoreMarker(): Song {
  return {
    id: crypto.randomUUID(),
    title: ENCORE_MARKER_TITLE,
    key: undefined,
    isEncoreMarker: true
  }
}

export function findEncoreMarkerIndex(set: SetItem): number {
  return set.songs.findIndex(song => isEncoreMarkerSong(song))
}

export function countPlayableSongs(set: SetItem): number {
  return set.songs.reduce(
    (acc, song) => acc + (isEncoreMarkerSong(song) ? 0 : 1),
    0
  )
}

export function hasEncoreMarker(set: SetItem): boolean {
  return findEncoreMarkerIndex(set) !== -1
}
