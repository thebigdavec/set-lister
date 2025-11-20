<script setup>
defineProps({
  set: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="preview-set">
    <div class="set-content">
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

.set-title {
  font-size: 18px;
  line-height: 1.2;
  margin: 0 0 0.5em 0;
  text-align: center;
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
