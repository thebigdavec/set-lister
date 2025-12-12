<script setup lang="ts">
import {
    computed,
    inject,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    watch,
} from "vue";
import { X, RotateCcw, Pencil, GripVertical } from "lucide-vue-next";
import type { Song } from "../store";
import type { UseSetlistNavigationReturn } from "../composables";

const props = defineProps<{
    song: Song;
    setIndex: number;
    songIndex: number;
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
    // Restore focus to the song item after saving
    nextTick(() => {
        songItemFocusRef.value?.focus();
    });
}

function cancel(): void {
    isCancelling.value = true;
    if (isMarker.value) {
        isEditing.value = false;
        isCancelling.value = false;
        return;
    }
    editTitle.value = props.song.title;
    editKey.value = props.song.key;
    isEditing.value = false;
    isCancelling.value = false;
    // Restore focus to the song item after canceling
    nextTick(() => {
        songItemFocusRef.value?.focus();
    });
}

function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape" && isEditing.value) {
        isCancelling.value = true;
        // Blur the active element first to prevent save from firing
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        cancel();
    }
}

// Inject navigation context from SetList
const navigation = inject<UseSetlistNavigationReturn>("setlistNavigation");
const songItemFocusRef = ref<HTMLDivElement | null>(null);

// Register/unregister element for focus management (skip encore markers)
// Handle the custom navigationEdit event from the global navigation handler
// This is triggered on keydown, so we need to wait for keyup before entering edit mode
function handleNavigationEdit(): void {
    if (props.isEncoreMarker) return;
    // Set pending edit - will be triggered on keyup
    pendingEditKey.value = "Enter";
    // Also listen for keyup on window to catch the release
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "e") {
            window.removeEventListener("keyup", handleKeyUp);
            if (pendingEditKey.value) {
                pendingEditKey.value = null;
                isEditing.value = true;
                nextTick(() => {
                    titleInputRef.value?.focus();
                });
            }
        }
    };
    window.addEventListener("keyup", handleKeyUp);
}

// Track the songIndex we registered with, so we can unregister correctly
const registeredSongIndex = ref<number | null>(null);

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    if (navigation && songItemFocusRef.value && !props.isEncoreMarker) {
        navigation.registerElement(
            props.setIndex,
            "song",
            songItemFocusRef.value,
            props.songIndex,
        );
        registeredSongIndex.value = props.songIndex;
        // Listen for custom event from navigation handler
        songItemFocusRef.value.addEventListener(
            "navigationEdit",
            handleNavigationEdit,
        );
    }
});

// Re-register element when songIndex changes (e.g., after reordering)
watch(
    () => props.songIndex,
    (newIndex, oldIndex) => {
        if (
            navigation &&
            songItemFocusRef.value &&
            !props.isEncoreMarker &&
            newIndex !== oldIndex &&
            registeredSongIndex.value !== null
        ) {
            // Unregister old position
            navigation.unregisterElement(
                props.setIndex,
                "song",
                registeredSongIndex.value,
            );
            // Register new position
            navigation.registerElement(
                props.setIndex,
                "song",
                songItemFocusRef.value,
                newIndex,
            );
            registeredSongIndex.value = newIndex;
        }
    },
);

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    if (
        navigation &&
        !props.isEncoreMarker &&
        registeredSongIndex.value !== null
    ) {
        navigation.unregisterElement(
            props.setIndex,
            "song",
            registeredSongIndex.value,
        );
    }
    // Clean up custom event listener
    if (songItemFocusRef.value) {
        songItemFocusRef.value.removeEventListener(
            "navigationEdit",
            handleNavigationEdit,
        );
    }
});

// Watch for edit requests on this song
watch(
    () => navigation?.editRequested.value,
    (request) => {
        if (
            request &&
            request.setIndex === props.setIndex &&
            request.type === "song" &&
            request.songIndex === props.songIndex &&
            !props.isEncoreMarker
        ) {
            isEditing.value = true;
            nextTick(() => {
                titleInputRef.value?.focus();
            });
            navigation?.clearEditRequest();
        }
    },
);

// Handle focus events to update navigation state
function handleSongFocus(): void {
    if (navigation && !props.isEncoreMarker) {
        // Guard against infinite loop: only call setFocus if not already focused on this item
        if (!navigation.isFocused(props.setIndex, "song", props.songIndex)) {
            navigation.setFocus({
                setIndex: props.setIndex,
                type: "song",
                songIndex: props.songIndex,
            });
        }
    }
}

// Check if this song item is currently focused via keyboard navigation
function isFocusedByNavigation(): boolean {
    if (!navigation || props.isEncoreMarker) return false;
    return navigation.isFocused(props.setIndex, "song", props.songIndex);
}

// Track if Enter/e is being held for edit trigger
const pendingEditKey = ref<string | null>(null);

// Handle keydown on the song item - mark that we want to edit on keyup
function handleSongKeyDown(event: KeyboardEvent): void {
    // Don't handle if modifiers are pressed (let shortcuts work)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "Enter" || event.key === "e") {
        event.preventDefault();
        event.stopPropagation();
        // Mark that this key should trigger edit on keyup
        pendingEditKey.value = event.key;
    }
}

// Handle keyup on the song item - actually enter edit mode
function handleSongKeyUp(event: KeyboardEvent): void {
    if (pendingEditKey.value && (event.key === "Enter" || event.key === "e")) {
        pendingEditKey.value = null;
        isEditing.value = true;
        nextTick(() => {
            titleInputRef.value?.focus();
        });
    }
}

// Handle keyup on title input
function handleTitleKeyUp(event: KeyboardEvent): void {
    if (event.key === "Enter") {
        save();
    }
}

// Handle keyup on key input
function handleKeyInputKeyUp(event: KeyboardEvent): void {
    if (event.key === "Enter") {
        save();
    }
}

const showDeleteConfirm = ref(false);
const isDeleting = ref(false);
const songItemRef = ref<HTMLDivElement | null>(null);

function confirmRemove(): void {
    showDeleteConfirm.value = true;
}

function handleDeleteConfirm(): void {
    showDeleteConfirm.value = false;
    isDeleting.value = true;

    // Wait for animation to complete before emitting remove
    setTimeout(() => {
        emit("remove");
    }, 300);
}

function handleDeleteCancel(): void {
    showDeleteConfirm.value = false;
}

// Pointer handling for tap-to-edit vs hold-to-drag
const pointerState = ref<{
    startX: number;
    startY: number;
    startTime: number;
    pointerId: number;
    hasMoved: boolean;
} | null>(null);

const MOVEMENT_THRESHOLD = 10; // pixels
const TAP_DURATION_THRESHOLD = 300; // ms
const titleInputRef = ref<HTMLInputElement | null>(null);

function handlePointerDown(e: PointerEvent): void {
    // Only handle primary button (left click / touch)
    if (e.button !== 0) return;
    // Don't handle if clicking on buttons, actions, or grip
    const target = e.target as HTMLElement;
    if (target.closest("button, .actions, .grip")) return;

    pointerState.value = {
        startX: e.clientX,
        startY: e.clientY,
        startTime: Date.now(),
        pointerId: e.pointerId,
        hasMoved: false,
    };
}

function handlePointerMove(e: PointerEvent): void {
    if (!pointerState.value) return;
    if (e.pointerId !== pointerState.value.pointerId) return;

    const dx = Math.abs(e.clientX - pointerState.value.startX);
    const dy = Math.abs(e.clientY - pointerState.value.startY);

    // Mark as moved if threshold exceeded
    if (dx >= MOVEMENT_THRESHOLD || dy >= MOVEMENT_THRESHOLD) {
        pointerState.value.hasMoved = true;
    }
}

function handlePointerUp(e: PointerEvent): void {
    if (!pointerState.value) return;
    if (e.pointerId !== pointerState.value.pointerId) return;

    const duration = Date.now() - pointerState.value.startTime;
    const hasMoved = pointerState.value.hasMoved;

    // If minimal movement and quick tap, enter edit mode
    if (!hasMoved && duration < TAP_DURATION_THRESHOLD) {
        isEditing.value = true;
        nextTick(() => {
            titleInputRef.value?.focus();
        });
    }

    pointerState.value = null;
}

function handlePointerCancel(): void {
    pointerState.value = null;
}
</script>

<template>
    <div
        ref="songItemRef"
        class="song-item card"
        :data-id="song.id"
        :data-encore-marker="isEncoreMarker ? 'true' : undefined"
        :class="{
            'is-encore': isEncore,
            'is-marker': isEncoreMarker,
            'is-deleting': isDeleting,
            'is-focused': isFocusedByNavigation(),
        }"
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
                <RotateCcw class="icon" />
            </Button>
        </div>

        <template v-else>
            <div
                v-if="!isEditing"
                ref="songItemFocusRef"
                class="view-mode"
                :tabindex="isEncoreMarker ? -1 : 0"
                @pointerdown="handlePointerDown"
                @pointermove="handlePointerMove"
                @pointerup="handlePointerUp"
                @pointercancel="handlePointerCancel"
                @focus="handleSongFocus"
                @keydown="handleSongKeyDown"
                @keyup="handleSongKeyUp"
            >
                <GripVertical class="grip" />
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
                            <Pencil class="icon" />
                        </Button>
                        <Button @click="confirmRemove" size="sm" class="delete">
                            <X class="icon" />
                        </Button>
                    </div>
                </div>
            </div>

            <div v-else class="edit-mode no-print">
                <input
                    ref="titleInputRef"
                    v-model="editTitle"
                    placeholder="Song Title"
                    @keyup="handleTitleKeyUp"
                    @blur="save"
                />
                <input
                    v-model="editKey"
                    placeholder="Song Key"
                    class="key-input"
                    @keyup="handleKeyInputKeyUp"
                    @blur="save"
                />
                <Button @click="save">Save</Button>
                <Button @mousedown="isCancelling = true" @click="cancel">
                    Cancel
                </Button>
            </div>
        </template>

        <ConfirmDialog
            :show="showDeleteConfirm"
            title="Delete Song"
            :message="`Are you sure you want to delete &quot;${song.title}&quot;?`"
            confirm-text="Delete"
            :danger="true"
            @confirm="handleDeleteConfirm"
            @cancel="handleDeleteCancel"
        />
    </div>
</template>

<style scoped>
.song-item {
    padding-inline: 0.75rem;
    margin-block-end: 0.15rem;
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    transition:
        transform 0.3s ease,
        opacity 0.3s ease,
        max-height 0.3s ease,
        margin 0.3s ease,
        padding 0.3s ease;
    max-height: 100px;
    overflow: hidden;

    &:is(:nth-child(even)) {
        background-color: #242424;
    }

    @media (min-width: 768px) {
        padding-block: 0.5rem;
    }
}

.song-item.is-deleting {
    transform: translateX(100%);
    opacity: 0;
    max-height: 0;
    margin-block-end: 0;
    padding-block: 0;
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
    cursor: pointer;
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
    opacity: 0.2;
    transition: opacity 100ms ease-out;
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

.song-item:hover .actions,
.song-item.is-focused .actions {
    transition: opacity 0.4s ease-in;
    opacity: 1;
}

.grip {
    cursor: grab;
    opacity: 0.2;
    transition: opacity 100ms ease-out;
    flex-shrink: 0;

    &:active {
        cursor: grabbing;
    }
}

.song-item:hover .grip,
.song-item.is-focused .grip {
    transition: opacity 250ms ease-in;
    opacity: 0.75;

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

.view-mode:focus {
    outline: none;
}

.view-mode:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
    border-radius: 4px;
}

.song-item.is-focused .view-mode {
    background-color: rgba(100, 108, 255, 0.1);
    border-radius: 4px;
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
