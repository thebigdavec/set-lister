import { computed, reactive, watch } from "vue";
import { STORAGE_KEYS } from "./constants";
import { formatSongLabel, measureSongLabelWidth } from "./utils/textMetrics";

export interface Song {
  id: string;
  title: string;
  key?: string;
  isEncoreMarker?: boolean;
}

export interface SetMetrics {
  longestEntryId: string | null;
  longestEntryText: string;
  longestEntryWidth16px: number;
  totalRows: number;
}

export interface SetItem {
  id: string;
  name: string;
  songs: Song[];
  metrics: SetMetrics;
}

export interface SetListMetadata {
  setListName: string;
  venue: string;
  date: string;
  actName: string;
}

export interface StoreState {
  isDirty: boolean;
  metadata: SetListMetadata;
  sets: SetItem[];
}

const ENCORE_MARKER_TITLE = "<encore>";

const EMPTY_METRICS: SetMetrics = {
  longestEntryId: null,
  longestEntryText: "",
  longestEntryWidth16px: 0,
  totalRows: 0,
};

function cloneEmptyMetrics(): SetMetrics {
  return { ...EMPTY_METRICS };
}

function isEncoreMarkerSong(song: Song | undefined): boolean {
  if (!song) return false;
  return song.isEncoreMarker === true || song.title === ENCORE_MARKER_TITLE;
}

function buildSetMetrics(songs: Song[]): SetMetrics {
  const filtered = songs.filter((song) => !isEncoreMarkerSong(song));
  if (filtered.length === 0) {
    return cloneEmptyMetrics();
  }

  let longestEntryId: string | null = null;
  let longestEntryText = "";
  let longestEntryWidth16px = 0;

  filtered.forEach((song) => {
    const label = formatSongLabel(song.title, song.key);
    const width = measureSongLabelWidth(song.title, song.key);
    if (width >= longestEntryWidth16px) {
      longestEntryWidth16px = width;
      longestEntryText = label;
      longestEntryId = song.id;
    }
  });

  return {
    longestEntryId,
    longestEntryText,
    longestEntryWidth16px,
    totalRows: filtered.length,
  };
}

function applySongAdditionMetrics(set: SetItem, song: Song): void {
  if (isEncoreMarkerSong(song)) {
    set.metrics = buildSetMetrics(set.songs);
    return;
  }
  const metrics = set.metrics ?? cloneEmptyMetrics();
  const label = formatSongLabel(song.title, song.key);
  const width = measureSongLabelWidth(song.title, song.key);
  const totalRows = set.songs.length;

  if (!metrics.longestEntryId || width >= metrics.longestEntryWidth16px) {
    set.metrics = {
      longestEntryId: song.id,
      longestEntryText: label,
      longestEntryWidth16px: width,
      totalRows,
    };
  } else {
    set.metrics = {
      ...metrics,
      totalRows,
    };
  }
}

function refreshSetMetrics(set: SetItem): void {
  set.metrics = buildSetMetrics(set.songs);
}

function createEmptySet(name: string): SetItem {
  return {
    id: crypto.randomUUID(),
    name,
    songs: [],
    metrics: cloneEmptyMetrics(),
  };
}

function createDefaultState(): StoreState {
  return {
    isDirty: false,
    metadata: {
      setListName: "",
      venue: "",
      date: "",
      actName: "",
    },
    sets: [createEmptySet("Set 1")],
  };
}

function parseSavedState(raw: string | null): Partial<StoreState> | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Partial<StoreState>;
  } catch (error) {
    console.error("Failed to parse saved state", error);
    return null;
  }
}

function normalizeSongs(songs?: Song[]): Song[] {
  if (!Array.isArray(songs)) return [];

  return songs.map((song, index) => ({
    id: typeof song?.id === "string" ? song.id : crypto.randomUUID(),
    title:
      typeof song?.title === "string" && song.title.trim().length > 0
        ? song.title
        : `Song ${index + 1}`,
    key: typeof song?.key === "string" ? song.key : undefined,
    isEncoreMarker: isEncoreMarkerSong(song),
  }));
}

function normalizeSets(sets?: SetItem[]): SetItem[] {
  if (!Array.isArray(sets)) {
    return createDefaultState().sets;
  }

  if (sets.length === 0) {
    return [];
  }

  return sets.map((set, index) => {
    const songs = normalizeSongs(set?.songs);
    return {
      id: typeof set?.id === "string" ? set.id : crypto.randomUUID(),
      name:
        typeof set?.name === "string" && set.name.trim().length > 0
          ? set.name
          : `Set ${index + 1}`,
      songs,
      metrics: buildSetMetrics(songs),
    };
  });
}

function createEncoreMarker(): Song {
  return {
    id: crypto.randomUUID(),
    title: ENCORE_MARKER_TITLE,
    key: undefined,
    isEncoreMarker: true,
  };
}

function findEncoreMarkerIndex(set: SetItem): number {
  return set.songs.findIndex((song) => isEncoreMarkerSong(song));
}

function countPlayableSongs(set: SetItem): number {
  return set.songs.reduce(
    (acc, song) => acc + (isEncoreMarkerSong(song) ? 0 : 1),
    0,
  );
}

export function hasEncoreMarker(set: SetItem): boolean {
  return findEncoreMarkerIndex(set) !== -1;
}

export { isEncoreMarkerSong };

function buildInitialState(): StoreState {
  const savedState = parseSavedState(localStorage.getItem(STORAGE_KEYS.DATA));
  const defaults = createDefaultState();

  return {
    isDirty: savedState?.isDirty ?? defaults.isDirty,
    metadata: {
      setListName:
        savedState?.metadata?.setListName ?? defaults.metadata.setListName,
      venue: savedState?.metadata?.venue ?? defaults.metadata.venue,
      date: savedState?.metadata?.date ?? defaults.metadata.date,
      actName: savedState?.metadata?.actName ?? defaults.metadata.actName,
    },
    sets: normalizeSets(savedState?.sets),
  };
}

export const store = reactive<StoreState>(buildInitialState());

/**
 * Computed property for the ID of the last set in the list.
 * Returns null if there are no sets.
 */
export const lastSetId = computed(() =>
  store.sets.length ? store.sets[store.sets.length - 1].id : null,
);

/**
 * Check if a set is the last set in the list.
 * @param setId - The ID of the set to check
 * @returns true if the set is the last one
 */
export function isLastSet(setId: string): boolean {
  return setId === lastSetId.value;
}

watch(
  store,
  (state) => {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(state));
  },
  { deep: true },
);

export function addSet(): void {
  store.sets.push(createEmptySet(`Set ${store.sets.length + 1}`));
  sanitizeEncoreMarkers();
  store.isDirty = true;
}

export function removeSet(setId: string): void {
  const index = store.sets.findIndex((set) => set.id === setId);
  if (index !== -1) {
    store.sets.splice(index, 1);
    sanitizeEncoreMarkers();
    store.isDirty = true;
  }
}

export function renameSet(setId: string, newName: string): void {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    set.name = newName;
    store.isDirty = true;
  }
}

export function addSongToSet(
  setId: string,
  song: {
    title: string;
    key?: string;
  },
): void {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const newSong: Song = {
      id: crypto.randomUUID(),
      ...song,
    };
    const markerIndex = findEncoreMarkerIndex(set);
    const markerIsLast =
      markerIndex !== -1 && markerIndex === set.songs.length - 1;

    if (markerIsLast) {
      set.songs.splice(markerIndex, 0, newSong);
      refreshSetMetrics(set);
    } else {
      set.songs.push(newSong);
      applySongAdditionMetrics(set, newSong);
    }
    sanitizeEncoreMarkers();
    store.isDirty = true;
  }
}

export function removeSongFromSet(setId: string, songId: string): void {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const index = set.songs.findIndex((s) => s.id === songId);
    if (index !== -1) {
      set.songs.splice(index, 1);
      refreshSetMetrics(set);
      sanitizeEncoreMarkers();
      store.isDirty = true;
    }
  }
}

export function reorderSong(
  setId: string,
  fromIndex: number,
  toIndex: number,
): void {
  const set = store.sets.find((s) => s.id === setId);
  if (set && fromIndex >= 0 && toIndex >= 0 && fromIndex < set.songs.length) {
    const [movedSong] = set.songs.splice(fromIndex, 1);
    const insertIndex = Math.min(toIndex, set.songs.length);
    set.songs.splice(insertIndex, 0, movedSong);
    refreshSetMetrics(set);
    store.isDirty = true;
  }
}

export function moveSong(
  fromSetId: string,
  toSetId: string,
  fromIndex: number,
  toIndex: number,
): void {
  const fromSet = store.sets.find((s) => s.id === fromSetId);
  const toSet = store.sets.find((s) => s.id === toSetId);

  if (fromSet && toSet && fromIndex >= 0 && fromIndex < fromSet.songs.length) {
    const [movedSong] = fromSet.songs.splice(fromIndex, 1);
    if (movedSong?.isEncoreMarker && fromSetId !== toSetId) {
      // Encore marker stays within its original set
      fromSet.songs.splice(fromIndex, 0, movedSong);
      return;
    }
    const insertIndex = Math.min(toIndex, toSet.songs.length);
    toSet.songs.splice(insertIndex, 0, movedSong);
    refreshSetMetrics(fromSet);
    refreshSetMetrics(toSet);
    sanitizeEncoreMarkers();
    store.isDirty = true;
  }
}

export function updateSong(
  setId: string,
  songId: string,
  updates: Partial<Omit<Song, "id">>,
): void {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const song = set.songs.find((s) => s.id === songId);
    if (song) {
      Object.assign(song, updates);
      refreshSetMetrics(set);
      store.isDirty = true;
    }
  }
}

export function updateMetadata(updates: Partial<SetListMetadata>): void {
  Object.assign(store.metadata, updates);
  store.isDirty = true;
}

export function markClean(): void {
  store.isDirty = false;
}

export function resetStore(): void {
  const newData = createDefaultState();
  store.sets = newData.sets;
  store.isDirty = newData.isDirty;
  store.metadata = newData.metadata;
  sanitizeEncoreMarkers();
}

export function loadStore(data: unknown): boolean {
  if (!data || typeof data !== "object") {
    console.error("Invalid data format");
    return false;
  }

  const candidate = data as Partial<StoreState>;

  if (!Array.isArray(candidate.sets)) {
    console.error("Invalid data format: sets missing");
    return false;
  }

  store.sets = normalizeSets(candidate.sets);
  store.metadata = {
    setListName: candidate.metadata?.setListName ?? "",
    venue: candidate.metadata?.venue ?? "",
    date: candidate.metadata?.date ?? "",
    actName: candidate.metadata?.actName ?? "",
  };
  sanitizeEncoreMarkers();
  store.isDirty = false;
  return true;
}

export function sanitizeEncoreMarkers(): void {
  if (!store.sets.length) return;
  const lastIndex = store.sets.length - 1;

  store.sets.forEach((set, index) => {
    const markerIndex = findEncoreMarkerIndex(set);
    const shouldHaveMarker =
      index === lastIndex && countPlayableSongs(set) >= 2;

    if (shouldHaveMarker && markerIndex === -1) {
      set.songs.push(createEncoreMarker());
      refreshSetMetrics(set);
    } else if (!shouldHaveMarker && markerIndex !== -1) {
      set.songs.splice(markerIndex, 1);
      refreshSetMetrics(set);
    }
  });
}
