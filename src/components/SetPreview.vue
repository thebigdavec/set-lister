<script setup>
import { computed } from 'vue';
import { store } from '../store';

defineProps({
  set: {
    type: Object,
    required: true
  }
});

const hasMetadata = computed(() => {
  const m = store.metadata;
  return m.setListName || m.venue || m.date || m.actName;
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
</script>

<template>
  <div class="preview-set">
    <div class="set-content">
      <div v-if="hasMetadata" class="metadata-header">
        <h1 v-if="store.metadata.setListName" class="meta-title">{{ store.metadata.setListName }}</h1>
        <div class="meta-details">
          <span v-if="store.metadata.actName" class="meta-item">{{ store.metadata.actName }}</span>
          <span v-if="store.metadata.venue" class="meta-item">{{ store.metadata.venue }}</span>
          <span v-if="store.metadata.date" class="meta-item">{{ formatDate(store.metadata.date) }}</span>
        </div>
      </div>

      <h2 class="set-title">{{ set.name }}</h2>
      
      <div class="song-list">
        <div v-for="song in set.songs" :key="song.id" class="preview-song">
          <span class="song-title">{{ song.title }}</span>
          <span v-if="song.key" class="song-key">({{ song.key }})</span>
        </div>
      </div>
      <div class="set-spacer">&nbsp;</div>
    </div>
  </div>
</template>

<style scoped>
.preview-set {
  /* Force A4 Page Dimensions */
  width: 210mm;
  min-height: 297mm;
  background-color: white;
  color: black;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  padding: 2rem;
  box-sizing: border-box;
  
  /* Page Break Logic */
  page-break-after: always;
  break-after: page;
  
  /* Flex layout */
  display: flex;
  flex-direction: column;
  /* justify-content: center; REMOVED */
}

.metadata-header {
  text-align: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
}

.meta-title {
  font-size: 24px;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.meta-details {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 14px;
  color: #444;
}

.meta-item {
  font-weight: 500;
}

.set-title {
  font-size: 18px;
  line-height: 1.2;
  margin: 0 0 0.5em 0;
  text-align: center;
  text-decoration: underline;
}

.set-content {
  display: flex;
  flex-direction: column;
  /* height: 100%; REMOVED */
  flex: 1; /* Allow it to grow */
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  flex: 1;
}

.preview-song {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.25em 0;
  white-space: nowrap;
}

.song-title {
  font-weight: 600;
  font-size: 1.2em;
}

.song-key {
  font-weight: bold;
  margin-left: 1em;
  font-size: 1em;
  color: #333;
}

.set-spacer {
  min-height: 1em;
}

@media print {
  .preview-set {
    width: 100%;
    height: 100%;
    min-height: 0;
    box-shadow: none;
    margin: 0;
    padding: 2rem;
    page-break-after: always;
  }
}
</style>
