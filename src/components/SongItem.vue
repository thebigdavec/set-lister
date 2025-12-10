<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { X, RotateCcw, Pencil, Grab, GripVertical } from "lucide-vue-next";
import type { Song } from "../store";

const props = defineProps<{
    song: Song;
    isEncore?: boolean;
    isEncoreMarker?: boolean;
    markerIsLast?: boolean;
}>();

const emit = defineEmits<{
    (e: "update", updates: Partial<Omit<Song, "id">>): void;
    (e: "remove"): void;
    (e: "reset-encore"): void;
}>();

const isEditing = ref(false);
const editTitle = ref(props.song.title);
const editKey = ref(props.song.key);
const isCancelling = ref(false);
const isMarker = computed(() => props.isEncoreMarker === true);
const markerIsLast = computed(() => props.markerIsLast === true);

watch(
    () => props.song,
    (newSong) => {
        editTitle.value = newSong.title;
        editKey.value = newSong.key;
    },
    { deep: true },
);

function save(): void {
    if (isMarker.value) return;
    if (isCancelling.value) {
        isCancelling.value = false;
        return;
    }
    emit("update", {
        title: editTitle.value,
        key: editKey.value,
    });
    isEditing.value = false;
}

function cancel(): void {
    isCancelling.value = false;
    if (isMarker.value) {
        isEditing.value = false;
        return;
    }
    editTitle.value = props.song.title;
    editKey.value = props.song.key;
    isEditing.value = false;
}
</script>

<template>
    <div
        class="song-item card"
        :data-id="song.id"
        :data-encore-marker="isEncoreMarker ? 'true' : undefined"
        :class="{ 'is-encore': isEncore, 'is-marker': isEncoreMarker }"
    >
        <div v-if="isMarker" class="marker-mode">
            <span class="marker-pill">&lt;Encores from here&gt;</span>
            <Button
                v-if="!markerIsLast"
                size="sm"
                class="icon-btn no-print marker-reset-btn delete"
                type="button"
                title="Reset encore marker to end"
                aria-label="Reset encore marker to end"
                @click.stop.prevent="$emit('reset-encore')"
            >
                <RotateCcw class="icon" class="icon" />
            </Button>
        </div>

        <template v-else>
            <div v-if="!isEditing" class="view-mode">
                <GripVertical class="icon" class="grip" />
                <div class="song-content">
                    <span class="song-title">{{ song.title }}</span>
                    <span v-if="song.key" class="song-key"
                        >({{ song.key }})</span
                    >
                </div>
                <div class="song-meta">
                    <span v-if="isEncore" class="encore-pill">Encores</span>
                    <div class="actions no-print">
                        <Button @click="isEditing = true" size="sm">
                            <Pencil class="icon" class="icon" />
                        </Button>
                        <Button
                            @click="$emit('remove')"
                            size="sm"
                            class="delete"
                        >
                            <X class="icon" class="icon" />
                        </Button>
                    </div>
                </div>
            </div>

            <div v-else class="edit-mode no-print">
                <input
                    v-model="editTitle"
                    placeholder="Song Title"
                    @keyup.enter="save"
                    @blur="save"
                    ref="titleInput"
                />
                <input
                    v-model="editKey"
                    placeholder="Song Key"
                    class="key-input"
                    @keyup.enter="save"
                    @blur="save"
                />
                <Button @click="save">Save</Button>
                <Button @mousedown="isCancelling = true" @click="cancel">
                    Cancel
                </Button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.song-item {
    padding-inline: 0.75rem;
    margin-block-end: 0.15rem;
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    cursor: grab;

    &:is(:nth-child(even)) {
        background-color: #242424;
    }

    @media (min-width: 768px) {
        padding-block: 0.5rem;
    }
}

.song-item:active {
    cursor: grabbing;
}

.song-item.is-encore {
    border: 1px solid var(--accent-color);
    background-color: rgba(100, 108, 255, 0.15);
}

.song-item.is-marker {
    border: 1px dashed var(--accent-color);
    background-color: rgba(100, 108, 255, 0.08);
    cursor: grab;
    padding: 0.35rem 0.75rem;
    justify-content: space-between;
}

.view-mode {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    gap: 0.75rem;
}

.song-content {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    width: 100%;
}

.song-title {
    font-weight: 500;
}

.song-key {
    color: #aaa;
    font-size: 0.8em;
}

.song-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
}

.encore-pill {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: rgba(100, 108, 255, 0.2);
    color: var(--accent-color);
    white-space: nowrap;
}

.song-item:hover .actions {
    opacity: 1;
}

.grip {
    cursor: grab;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.song-item:hover .grip {
    opacity: 0.5;

    &:hover {
        opacity: 1;
    }
}

@media (hover: none) {
    .actions {
        opacity: 1;
    }

    .grip {
        opacity: 0.5;
    }
}

.delete:hover {
    color: #ff4444;
    border-color: #ff4444;
}

.edit-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
}

.edit-mode input {
    flex: 1;
}

.key-input {
    flex: 0 0 80px;
}

.marker-mode {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 0.75rem;
}

.marker-pill {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-color);
}

.marker-reset-btn {
    margin-left: auto;
}
</style>
