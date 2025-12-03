<script setup lang="ts">
  import { computed } from 'vue';
  import { store, type SetItem } from '../store';

  const props = defineProps<{
    set: SetItem;
  }>();

  const hasMetadata = computed(() => {
    const m = store.metadata;
    return Boolean(m.setListName || m.venue || m.date || m.actName);
  });

  const showHeader = computed(() => hasMetadata.value || Boolean(props.set?.name));

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
</script>

<template>
  <div class="preview-set" :data-set-id="set.id">
    <div class="set-content">
      <div v-if="showHeader" class="metadata-header">
        <div v-if="hasMetadata" class="meta-left">
          <h1 v-if="store.metadata.setListName" class="meta-title">{{ store.metadata.setListName }}</h1>
          <div class="meta-details">
            <span v-if="store.metadata.actName" class="meta-item">{{ store.metadata.actName }}</span>
            <span v-if="store.metadata.venue" class="meta-item">{{ store.metadata.venue }}</span>
            <span v-if="store.metadata.date" class="meta-item">{{ formatDate(store.metadata.date) }}</span>
          </div>
        </div>
        <div v-if="set.name" class="meta-right">
          <div>&nbsp;</div>
          <div class="set-name">{{ set.name }}</div>
        </div>
      </div>

      <div class="song-list" :data-set-id="set.id">
        <div v-for="song in set.songs" :key="song.id" class="preview-song">
          <span class="song-label">
            <span class="song-title">{{ song.title }}</span><span v-if="song.key" class="song-key"> ({{ song.key
            }})</span>
          </span>
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
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
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
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #000;
    padding-bottom: 1rem;
  }

  .meta-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta-title {
    font-size: 1.5em;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.125em;
  }

  .meta-details {
    display: flex;
    justify-content: flex-start;
    gap: 1.5rem;
    font-size: 0.875em;
    color: #444;
  }

  .meta-item {
    font-weight: 500;
  }

  .meta-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    gap: 0.25rem;
  }

  .set-label {
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #555;
  }

  .set-name {
    font-size: 1.25em;
    font-weight: 700;
  }

  .set-content {
    display: flex;
    flex-direction: column;
    /* height: 100%; REMOVED */
    flex: 1;
    /* Allow it to grow */
  }

  .song-list {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    flex: 0 0 auto;
    align-self: stretch;
  }

  .preview-song {
    padding: 0.25em 0;
    white-space: nowrap;
  }

  .song-label {
    font-weight: 600;
    font-size: inherit;
  }

  .song-title {
    font-weight: inherit;
  }

  .song-key {
    font-weight: 500;
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
