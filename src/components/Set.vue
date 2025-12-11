<script setup lang="ts">
import {
    computed,
    inject,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    toRef,
    watch,
} from "vue";

import { Plus, Trash } from "lucide-vue-next";
import Sortable, { MoveEvent, SortableEvent } from "sortablejs";
import SongItem from "./SongItem.vue";
import {
    addSongToSet,
    getSetDisplayName,
    moveSong,
    removeSongFromSet,
    renameSet,
    reorderSong,
    updateSong,
    type SetItem,
    isEncoreMarkerSong,
} from "../store";
import {
    useEncoreHelpers,
    type UseSetlistNavigationReturn,
} from "../composables";

const props = defineProps<{
    set: SetItem;
    setIndex: number;
    isLast: boolean;
}>();

// Use the consolidated encore helpers
const { markerIndex, hasEncoreMarker, markerIsLast, isEncoreSongByIndex } =
    useEncoreHelpers({
        set: toRef(props, "set"),
        isLast: toRef(props, "isLast"),
    });

defineEmits<{ (e: "remove-set"): void }>();

// Compute the display name (custom name or dynamic "Set #")
const displayName = computed(() => getSetDisplayName(props.set.id));

// Inject navigation context from SetList
const navigation = inject<UseSetlistNavigationReturn>("setlistNavigation");

const songListRef = ref<HTMLDivElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);
const setNameRef = ref<HTMLHeadingElement | null>(null);
let sortableInstance: Sortable | null = null;

const newSongTitle = ref("");
const newSongKey = ref("");

// Track if set name is in edit mode
const isEditingName = ref(false);

// Register set name element for focus management
onMounted(() => {
    if (navigation && setNameRef.value) {
        navigation.registerElement(props.setIndex, "name", setNameRef.value);
    }
});

onUnmounted(() => {
    if (navigation) {
        navigation.unregisterElement(props.setIndex, "name");
    }
});

// Watch for edit requests on this set's name
watch(
    () => navigation?.editRequested.value,
    (request) => {
        if (
            request &&
            request.setIndex === props.setIndex &&
            request.type === "name"
        ) {
            isEditingName.value = true;
            nextTick(() => {
                if (setNameRef.value) {
                    setNameRef.value.focus();
                    // Select all text in contenteditable
                    const range = document.createRange();
                    range.selectNodeContents(setNameRef.value);
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
            });
            navigation?.clearEditRequest();
        }
    },
);

// Handle focus events on set name to update navigation state
function handleSetNameFocus(): void {
    if (navigation) {
        navigation.setFocus({ setIndex: props.setIndex, type: "name" });
    }
}

// Handle keydown on set name
function handleSetNameKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
        isEditingName.value = false;
        setNameRef.value?.blur();
    } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        setNameRef.value?.blur();
    }
}

// Get playable song indices (excluding encore markers)
function getPlayableSongIndices(): number[] {
    return props.set.songs
        .map((song, index) => ({ song, index }))
        .filter(({ song }) => !isEncoreMarkerSong(song))
        .map(({ index }) => index);
}

const encoreSummary = computed(() => {
    if (!props.isLast) return "Encore marker appears only in the final set.";
    if (props.set.songs.length < 2)
        return "Add two or more songs to unlock encores.";
    if (!hasEncoreMarker.value)
        return "Encore marker will appear automatically when eligible.";
    return "Drag the <encore> entry to choose where encores begin.";
});

async function addSong(): Promise<void> {
    if (!newSongTitle.value.trim()) return;

    addSongToSet(props.set.id, {
        title: newSongTitle.value,
        key: newSongKey.value,
    });

    newSongTitle.value = "";
    newSongKey.value = "";

    await nextTick();
    titleInputRef.value?.focus();
}

function handleTitleBlur(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    renameSet(props.set.id, target.innerText);
    isEditingName.value = false;
}

function handleSortEnd(evt: SortableEvent): void {
    const fromSetId = props.set.id;
    const toSetId = (evt.to as HTMLElement | null)?.dataset.setId;

    if (!toSetId) return;

    if (evt.to === evt.from) {
        reorderSong(fromSetId, evt.oldIndex ?? 0, evt.newIndex ?? 0);
    } else {
        moveSong(fromSetId, toSetId, evt.oldIndex ?? 0, evt.newIndex ?? 0);
    }
}

function handleSortMove(evt: MoveEvent): boolean {
    const dragged = evt.dragged as HTMLElement | null;
    if (!dragged) return true;
    const isMarker = dragged.dataset.encoreMarker === "true";
    if (!isMarker) return true;
    if (!props.isLast) return false;
    if (evt.to !== evt.from) return false;
    return true;
}

function songIsEncore(index: number): boolean {
    return isEncoreSongByIndex(index);
}

function resetEncoreMarker(): void {
    const index = markerIndex.value;
    if (index === -1) return;
    const lastIndex = props.set.songs.length - 1;
    if (index === lastIndex) return;
    reorderSong(props.set.id, index, lastIndex);
}

onMounted(() => {
    if (!songListRef.value) return;

    sortableInstance = new Sortable(songListRef.value, {
        group: "songs",
        animation: 150,
        ghostClass: "sortable-ghost",
        draggable: ".song-item",
        filter: "button, .actions, input",
        preventOnFilter: false,
        onMove: handleSortMove,
        onEnd: handleSortEnd,
    });
});

onUnmounted(() => {
    sortableInstance?.destroy();
});
</script>

<template>
    <div class="set-container card">
        <div class="set-header">
            <h2
                ref="setNameRef"
                contenteditable
                tabindex="0"
                :class="{
                    'is-focused': navigation?.isFocused(setIndex, 'name'),
                }"
                @blur="handleTitleBlur"
                @focus="handleSetNameFocus"
                @keydown="handleSetNameKeyDown"
            >
                {{ displayName }}
            </h2>
            <Button
                @click="$emit('remove-set')"
                size="sm"
                class="no-print danger"
            >
                <Trash class="icon" />
                Delete
            </Button>
        </div>

        <div ref="songListRef" class="song-list" :data-set-id="set.id">
            <SongItem
                v-for="(song, index) in set.songs"
                :key="song.id"
                :song="song"
                :set-index="setIndex"
                :song-index="index"
                :is-encore="songIsEncore(index)"
                :is-encore-marker="song.isEncoreMarker === true"
                :marker-is-last="markerIsLast"
                @update="(updates) => updateSong(set.id, song.id, updates)"
                @remove="removeSongFromSet(set.id, song.id)"
                @reset-encore="resetEncoreMarker"
            />
        </div>

        <div class="add-song no-print">
            <input
                ref="titleInputRef"
                v-model="newSongTitle"
                placeholder="Song Title"
                @keyup.enter="addSong"
            />
            <input
                v-model="newSongKey"
                placeholder="Song Key"
                class="key-input"
                @keyup.enter="addSong"
            />
            <Button v-if="newSongTitle.length" @click="addSong">
                <Plus class="icon" /> Save
            </Button>
        </div>

        <div v-if="isLast" class="encore-actions no-print">
            <p class="marker-hint">{{ encoreSummary }}</p>
        </div>
    </div>
</template>

<style scoped>
.set-container {
    background-color: #1e1e1e;
    display: flex;
    flex-direction: column;
}

.set-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.5rem;
}

.set-header h2 {
    margin: 0;
    outline: none;
    border-bottom: 2px solid transparent;
    transition: border-bottom-color 0.3s ease;
}

.set-header h2:focus,
.set-header h2.is-focused {
    border-bottom-color: var(--accent-color);
    outline: none;
}

.set-header h2:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
}

.song-list {
    min-height: 50px;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.add-song {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
    flex-wrap: wrap;
}

.add-song input {
    border-color: var(--accent-color);
}

.add-song input:not(.key-input) {
    flex: 1;
}

.sortable-ghost {
    opacity: 0.5;
    background: #333;
}

.encore-actions {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.marker-hint {
    margin: 0;
    font-size: 0.85rem;
    color: #bbbbbb;
}
</style>
