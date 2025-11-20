<script setup>
import { ref } from 'vue';
import Sortable from 'sortablejs';
import { onMounted, onUnmounted } from 'vue';
import SongItem from './SongItem.vue';
import { reorderSong, moveSong, addSongToSet, removeSongFromSet, updateSong } from '../store';

const props = defineProps({
  set: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['remove-set']);

const songListRef = ref(null);
let sortableInstance = null;

const newSongTitle = ref('');
const newSongKey = ref('');

function addSong() {
  if (!newSongTitle.value.trim()) return;
  
  addSongToSet(props.set.id, {
    title: newSongTitle.value,
    key: newSongKey.value
  });
  
  newSongTitle.value = '';
  newSongKey.value = '';
}

onMounted(() => {
  sortableInstance = new Sortable(songListRef.value, {
    group: 'songs',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const fromSetId = props.set.id;
      const toSetId = evt.to.dataset.setId;
      
      if (evt.to === evt.from) {
        reorderSong(fromSetId, evt.oldIndex, evt.newIndex);
      } else {
        moveSong(fromSetId, toSetId, evt.oldIndex, evt.newIndex);
      }
    }
  });
});

onUnmounted(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
  }
});
</script>

<template>
  <div class="set-container card">
    <div class="set-header">
      <h2 contenteditable @blur="$event => set.name = $event.target.innerText">{{ set.name }}</h2>
      <button @click="$emit('remove-set')" class="icon-btn delete no-print">Delete Set</button>
    </div>
    
    <div ref="songListRef" class="song-list" :data-set-id="set.id">
      <SongItem 
        v-for="song in set.songs" 
        :key="song.id" 
        :song="song"
        @update="(updates) => updateSong(set.id, song.id, updates)"
        @remove="removeSongFromSet(set.id, song.id)"
      />
    </div>
    
    <div class="add-song no-print">
      <input 
        v-model="newSongTitle" 
        placeholder="Add new song..." 
        @keyup.enter="addSong"
      >
      <input 
        v-model="newSongKey" 
        placeholder="Key" 
        class="key-input"
        @keyup.enter="addSong"
      >
      <button @click="addSong">+</button>
    </div>
  </div>
</template>

<style scoped>
.set-container {
  background-color: #1e1e1e;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media print {
  /* Removed print styles as Set.vue is no longer used for printing */
}

.set-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
}

.set-header h2 {
  margin: 0;
  font-size: 1.5em;
  outline: none;
}

.set-header h2:focus {
  border-bottom: 1px solid var(--accent-color);
}

.song-list {
  min-height: 50px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-song {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.add-song input {
  flex: 1;
}

.key-input {
  flex: 0 0 60px;
}

.sortable-ghost {
  opacity: 0.5;
  background: #333;
}
</style>
