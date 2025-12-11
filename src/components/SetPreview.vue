<script setup lang="ts">
import { computed, toRef, toRefs } from "vue";
import { type SetItem, type SetListMetadata } from "../store";
import { useEncoreHelpers } from "../composables";

const props = withDefaults(
    defineProps<{
        set: SetItem;
        setIndex: number;
        metadata: SetListMetadata;
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

// Compute the display name (custom name or dynamic "Set #")
const displayName = computed(
    () => props.set.name || `Set ${props.setIndex + 1}`,
);

const { set, metadata, uppercase, showGuides, isLast } = toRefs(props);

// Use the consolidated encore helpers
const {
    markerIndex,
    firstEncoreSongId,
    songsWithoutMarker: previewSongs,
    isEncoreSong,
} = useEncoreHelpers({
    set: toRef(props, "set"),
    isLast: toRef(props, "isLast"),
});

// Determine whether any optional metadata exists to show the left-hand header block
const hasMetadata = computed(() => {
    const m = metadata.value;
    return Boolean(m.setListName || m.venue || m.date || m.actName);
});

// Always show header since we always have a display name (dynamic "Set #" fallback)
const showHeader = true;

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
                    <h1 v-if="metadata.setListName" class="meta-title">
                        {{ metadata.setListName }}
                    </h1>
                    <div class="meta-details">
                        <span v-if="metadata.actName" class="meta-item">{{
                            metadata.actName
                        }}</span>
                        <span v-if="metadata.venue" class="meta-item">{{
                            metadata.venue
                        }}</span>
                        <span v-if="metadata.date" class="meta-item">{{
                            formatDate(metadata.date)
                        }}</span>
                    </div>
                </div>
                <div class="meta-right">
                    <div>&nbsp;</div>
                    <div class="set-name">{{ displayName }}</div>
                </div>
            </div>

            <!-- Primary song list with optional encore divider -->
            <div class="song-list" :data-set-id="set.id">
                <template v-for="song in previewSongs" :key="song.id">
                    <div
                        v-if="song.id === firstEncoreSongId"
                        class="preview-encore-divider"
                    >
                        <span>encores</span>
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

    /* Flex layout */
    display: flex;
    flex-direction: column;
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
    flex: 1;
    position: relative;
    z-index: 1;
}

.preview-song {
    white-space: nowrap;
}

.song-key {
    font-weight: 400;
}

.preview-song.is-encore {
    color: #ccc;
    font-style: italic;
}

.preview-encore-divider {
    margin: 0.5rem 0;
    position: relative;
}

.preview-encore-divider span {
    position: absolute;
    top: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #444;
    padding: 0 2rem;
    border-radius: 100%;
    border-inline: 200px solid #6c4dff80;
}

.song-label {
    font-weight: 600;
    font-size: inherit;
}

.song-title {
    font-weight: inherit;
}

.set-spacer {
    min-height: 1em;
    min-height: 0;
}

@page {
    size: A4;
    margin: 0;
}

@media print {
    .preview-set {
        width: 210mm;
        height: 290mm;
        box-shadow: none;
        overflow: hidden;
    }

    .page-guide,
    .margin-guide {
        display: none;
    }
}
</style>
