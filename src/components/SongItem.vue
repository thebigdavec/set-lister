<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  song: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update', 'remove']);

const isEditing = ref(false);
const editTitle = ref(props.song.title);
const editKey = ref(props.song.key);

watch(() => props.song, (newSong) => {
  editTitle.value = newSong.title;
  editKey.value = newSong.key;
}, { deep: true });

function save() {
  emit('update', {
    title: editTitle.value,
    key: editKey.value
  });
  isEditing.value = false;
}

function cancel() {
  editTitle.value = props.song.title;
  editKey.value = props.song.key;
  isEditing.value = false;
}
</script>

<template>
  <div class="song-item card" :data-id="song.id">
    <div v-if="!isEditing" class="view-mode">
      <div class="song-content">
        <span class="song-title">{{ song.title }}</span>
        <span v-if="song.key" class="song-key">({{ song.key }})</span>
      </div>
      <div class="actions no-print">
        <button @click="isEditing = true" class="icon-btn">✎</button>
        <button @click="$emit('remove')" class="icon-btn delete">×</button>
      </div>
    </div>
    
    <div v-else class="edit-mode no-print">
      <input 
        v-model="editTitle" 
        placeholder="Song Title"
        @keyup.enter="save"
        @blur="save"
        ref="titleInput"
      >
      <input 
        v-model="editKey" 
        placeholder="Key" 
        class="key-input"
        @keyup.enter="save"
        @blur="save"
      >
      <button @click="save">Save</button>
      <button @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.song-item {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  background-color: #2a2a2a;
  cursor: grab;
}

.song-item:active {
  cursor: grabbing;
}

.view-mode {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.song-content {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.song-title {
  font-weight: 600;
  font-size: 1.1em;
}

.song-key {
  color: #888;
  font-size: 0.9em;
}

.actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .actions {
  opacity: 1;
}

.icon-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.9em;
  background: transparent;
}

.icon-btn.delete:hover {
  color: #ff4444;
  border-color: #ff4444;
}

.edit-mode {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.edit-mode input {
  flex: 1;
}

.key-input {
  flex: 0 0 80px;
}

/* Print styles removed */
</style>