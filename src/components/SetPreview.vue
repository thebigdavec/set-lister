<script setup lang="ts">
import { computed, toRefs, withDefaults } from "vue";
import { isEncoreMarkerSong, store, type SetItem, type Song } from "../store";

const props = withDefaults(
    defineProps<{
        set: SetItem;
        uppercase?: boolean;
        showGuides?: boolean;
        isLast?: boolean;
    }>(),
    {
        uppercase: false,
        showGuides: false,
        isLast: false,
    },
);

const { set, uppercase, showGuides, isLast } = toRefs(props);

// Determine whether any optional metadata exists to show the left-hand header block
const hasMetadata = computed(() => {
    const m = store.metadata;
    return Boolean(m.setListName || m.venue || m.date || m.actName);
});

// Only render the header section when there is either metadata or a set name defined
const showHeader = computed(
    () => hasMetadata.value || Boolean(set.value?.name),
);

// Encore markers only matter on the final set; find their index or return -1 when absent
const markerIndex = computed(() => {
    if (!isLast.value) return -1;
    return set.value.songs.findIndex(isEncoreMarkerSong);
});

// Used to insert a visual divider before the first encore song
const firstEncoreSongId = computed(() => {
    const idx = markerIndex.value;
    if (idx === -1) return null;
    return set.value.songs[idx + 1]?.id ?? null;
});

// Filter out the artificial encore marker entries so only real songs render
const previewSongs = computed(() =>
    set.value.songs.filter((song) => !isEncoreMarkerSong(song)),
);

// Helper to flag encore songs so they can be styled differently in the list
function isEncoreSong(song: Song): boolean {
    if (!isLast.value) return false;
    const idx = markerIndex.value;
    if (idx === -1) return false;
    const originalIndex = set.value.songs.findIndex((s) => s.id === song.id);
    return originalIndex > idx;
}

// Present dates in a long, locale-aware format so printed set lists read naturally
function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
</script>

<template>
    <div class="preview-set" :data-set-id="set.id">
        <!-- Visual guides that mirror real-world page dimensions/margins for print preview -->
        <div v-show="showGuides" class="page-guide" aria-hidden="true"></div>
        <div v-show="showGuides" class="margin-guide" aria-hidden="true"></div>
        <div class="set-content">
            <!-- Header block summarizing show metadata and set name -->
            <div v-if="showHeader" class="metadata-header">
                <div v-if="hasMetadata" class="meta-left">
                    <h1 v-if="store.metadata.setListName" class="meta-title">
                        {{ store.metadata.setListName }}
                    </h1>
                    <div class="meta-details">
                        <span v-if="store.metadata.actName" class="meta-item">{{
                            store.metadata.actName
                        }}</span>
                        <span v-if="store.metadata.venue" class="meta-item">{{
                            store.metadata.venue
                        }}</span>
                        <span v-if="store.metadata.date" class="meta-item">{{
                            formatDate(store.metadata.date)
                        }}</span>
                    </div>
                </div>
                <div v-if="set.name" class="meta-right">
                    <div>&nbsp;</div>
                    <div class="set-name">{{ set.name }}</div>
                </div>
            </div>

            <!-- Primary song list with optional encore divider -->
            <div class="song-list" :data-set-id="set.id">
                <template v-for="song in previewSongs" :key="song.id">
                    <div
                        v-if="song.id === firstEncoreSongId"
                        class="preview-encore-divider"
                    >
                        <span>---- encores ----</span>
                    </div>
                    <div
                        class="preview-song"
                        :class="{ 'is-encore': isEncoreSong(song) }"
                    >
                        <span class="song-label">
                            <span class="song-title">{{
                                uppercase
                                    ? song.title.toUpperCase()
                                    : song.title
                            }}</span
                            ><span v-if="song.key" class="song-key">
                                ({{ song.key }})</span
                            >
                        </span>
                    </div>
                </template>
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
    padding: 1cm;
    box-sizing: border-box;

    /* Page Break Logic */
    page-break-after: always;
    break-after: page;

    /* Flex layout */
    display: flex;
    flex-direction: column;
    /* justify-content: center; REMOVED */
    position: relative;
}

.page-guide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    aspect-ratio: 210 / 297;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 0;
    outline: 1px solid red;
}

.margin-guide {
    position: absolute;
    inset: 1cm;
    aspect-ratio: 210 / 297;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 0;
    outline: 1px dashed red;
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
    position: relative;
    z-index: 1;
}

.preview-song {
    white-space: nowrap;
}

.preview-song.is-encore {
    color: #6c4dff;
    font-style: italic;
}

.preview-encore-divider {
    margin: 0.5rem 0;
    position: relative;
}

.preview-encore-divider span {
    position: absolute;
    top: -0.75rem;
    left: 0;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6c4dff;
    background: #fff;
    padding: 0 0.4rem;
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
