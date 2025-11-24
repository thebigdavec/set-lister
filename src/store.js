import { reactive, watch } from "vue";

const STORAGE_KEY = "set-lister-data";

const defaultData = {
  isDirty: false,
  metadata: {
    setListName: "",
    venue: "",
    date: "",
    actName: "",
  },
  sets: [
    {
      id: crypto.randomUUID(),
      name: "Set 1",
      songs: [],
    },
  ],
};

const savedData = localStorage.getItem(STORAGE_KEY);
const initialState = savedData ? { ...defaultData, ...JSON.parse(savedData) } : defaultData;

// Ensure metadata exists if loading from legacy data
if (!initialState.metadata) {
  initialState.metadata = { ...defaultData.metadata };
}
// Ensure isDirty exists if loading from legacy data
if (typeof initialState.isDirty === 'undefined') {
  initialState.isDirty = false;
}

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
  store.isDirty = true;
}

export function removeSet(setId) {
  const index = store.sets.findIndex((s) => s.id === setId);
  if (index !== -1) {
    store.sets.splice(index, 1);
    store.isDirty = true;
  }
}

export function renameSet(setId, newName) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    set.name = newName;
    store.isDirty = true;
  }
}

export function addSongToSet(setId, song) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    set.songs.push({
      id: crypto.randomUUID(),
      ...song,
    });
    store.isDirty = true;
  }
}

export function removeSongFromSet(setId, songId) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const index = set.songs.findIndex((s) => s.id === songId);
    if (index !== -1) {
      set.songs.splice(index, 1);
      store.isDirty = true;
    }
  }
}

export function reorderSong(setId, fromIndex, toIndex) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const [movedSong] = set.songs.splice(fromIndex, 1);
    set.songs.splice(toIndex, 0, movedSong);
    store.isDirty = true;
  }
}

export function moveSong(fromSetId, toSetId, fromIndex, toIndex) {
  const fromSet = store.sets.find((s) => s.id === fromSetId);
  const toSet = store.sets.find((s) => s.id === toSetId);

  if (fromSet && toSet) {
    const [movedSong] = fromSet.songs.splice(fromIndex, 1);
    toSet.songs.splice(toIndex, 0, movedSong);
    store.isDirty = true;
  }
}

export function updateSong(setId, songId, updates) {
  const set = store.sets.find((s) => s.id === setId);
  if (set) {
    const song = set.songs.find((s) => s.id === songId);
    if (song) {
      Object.assign(song, updates);
      store.isDirty = true;
    }
  }
}

export function updateMetadata(updates) {
  Object.assign(store.metadata, updates);
  store.isDirty = true;
}

export function markClean() {
  store.isDirty = false;
}

export function resetStore() {
  // Reset to default data
  // We need to clone defaultData to avoid reference issues
  const newData = JSON.parse(JSON.stringify(defaultData));

  // Update store properties
  store.sets = newData.sets;
  store.isDirty = false; // Reset dirty state
  // Ensure metadata is reset too
  if (newData.metadata) {
    store.metadata = newData.metadata;
  } else {
    // Fallback if defaultData doesn't have metadata yet (though it should)
    store.metadata = {
      setListName: "",
      venue: "",
      date: "",
      actName: "",
    };
  }
  // Re-generate IDs for the default set to ensure uniqueness
  store.sets[0].id = crypto.randomUUID();
}

export function loadStore(data) {
  // Basic validation
  if (!data || !Array.isArray(data.sets)) {
    console.error("Invalid data format");
    return false;
  }

  store.sets = data.sets;
  store.metadata = data.metadata || {
    setListName: "",
    venue: "",
    date: "",
    actName: "",
  };
  store.isDirty = false;
  return true;
}
