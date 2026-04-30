export interface Song {
  id: string
  title: string
  key?: string
  isEncoreMarker?: boolean
}

export interface SetMetrics {
  longestEntryId: string | null
  longestEntryText: string
  longestEntryWidth16px: number
  totalRows: number
}

export interface SetItem {
  id: string
  name?: string
  songs: Song[]
  metrics: SetMetrics
}

export interface SetListMetadata {
  setListName: string
  venue: string
  date: string
  actName: string
}

export interface StoreState {
  schemaVersion: number
  metadata: SetListMetadata
  sets: SetItem[]
}
