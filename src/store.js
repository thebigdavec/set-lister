import { reactive, watch } from "vue";

const STORAGE_KEY = "set-lister-data";

const defaultData = {
  sets: [
    {
      id: crypto.randomUUID(),
      name: "Set 1",
      songs: [],
    },
  ],
};

const savedData = localStorage.getItem(STORAGE_KEY);
const initialState = savedData ? JSON.parse(savedData) : defaultData;

export const store = reactive(initialState);

watch(
  store,
  (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  { deep: true }
);

export function addSet() {
  store.sets.push({
    id: crypto.randomUUID(),
    name: `Set ${store.sets.length + 1}`,
    songs: [],
  });
}

export function removeSet(setId) {
  const index = store.sets.findIndex((s) => s.id === setId);
  if (index !== -1) {
    store.sets.splice(index, 1);
  }
}

export function addSongToSet(setId, song) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    set.songs.push({
      id: crypto.randomUUID(),
      ...song,
    });
  }
}

export function removeSongFromSet(setId, songId) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const index = set.songs.findIndex((s) => s.id === songId);
    if (index !== -1) {
      set.songs.splice(index, 1);
    }
  }
}

export function reorderSong(setId, fromIndex, toIndex) {
  const set = store.sets.find(s => s.id === setId);
  if (set) {
    const [movedSong] = set.songs.splice(fromIndex, 1);
    set.songs.splice(toIndex, 0, movedSong);
  }
}

export function moveSong(fromSetId, toSetId, fromIndex, toIndex) {
  const fromSet = store.sets.find(s => s.id === fromSetId);
  const toSet = store.sets.find(s => s.id === toSetId);
  
  if (fromSet && toSet) {
    const [movedSong] = fromSet.songs.splice(fromIndex, 1);
    toSet.songs.splice(toIndex, 0, movedSong);
  }
}

export function updateSong(setId, songId, updates) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const song = set.songs.find((s) => s.id === songId);
    if (song) {
      Object.assign(song, updates);
    }
  }
}
