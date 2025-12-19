<script setup lang="ts">
import {
	computed,
	inject,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	watch,
	type DeepReadonly,
	type Ref,
} from "vue";
import type { Song } from "../store";
import type { UseSetlistNavigationReturn } from "../composables";
import EncoreMarker from "./SongItem/EncoreMarker.vue";
import SongItemDisplay from "./SongItem/SongItemDisplay.vue";
import SongItemEdit from "./SongItem/SongItemEdit.vue";

// Type for edit mode context provided by Set.vue
interface EditModeContext {
	activeEditId: DeepReadonly<Ref<string | null>>;
	claim: (id: string) => void;
	release: (id: string) => void;
}

const props = defineProps<{
	song: Song;
	setIndex: number;
	songIndex: number;
	songNumber?: number;
	showNumber?: boolean;
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
const songItemEditRef = ref<InstanceType<typeof SongItemEdit> | null>(null);

const isMarker = computed(() => props.isEncoreMarker === true);
const markerIsLast = computed(() => props.markerIsLast === true);

// Inject edit mode context from Set.vue
const editModeContext = inject<EditModeContext>("editModeContext");

// Unique ID for this song item's edit mode
const editModeId = computed(() => `song-${props.song.id}`);

// Watch for another component claiming edit mode
watch(
	() => editModeContext?.activeEditId.value,
	(newId) => {
		if (newId !== null && newId !== editModeId.value && isEditing.value) {
			// Another component claimed edit mode, exit our edit mode without saving
			cancelWithoutFocus();
		}
	},
);

// Cancel without restoring focus (used when another component claims edit mode)
function cancelWithoutFocus(): void {
	isCancelling.value = true;
	editTitle.value = props.song.title;
	editKey.value = props.song.key;
	isEditing.value = false;
	editModeContext?.release(editModeId.value);
	isCancelling.value = false;
}

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
	editModeContext?.release(editModeId.value);
	// Restore focus to the song item after saving
	nextTick(() => {
		songItemFocusRef.value?.$el.value?.focus();
	});
}

function cancel(): void {
	isCancelling.value = true;
	if (isMarker.value) {
		isEditing.value = false;
		editModeContext?.release(editModeId.value);
		isCancelling.value = false;
		return;
	}
	editTitle.value = props.song.title;
	editKey.value = props.song.key;
	isEditing.value = false;
	editModeContext?.release(editModeId.value);
	isCancelling.value = false;
	// Restore focus to the song item after canceling
	nextTick(() => {
		songItemFocusRef.value?.$el.value?.focus();
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
const songItemFocusRef = ref<InstanceType<typeof SongItemDisplay> | null>(null);

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
				editModeContext?.claim(editModeId.value);
				isEditing.value = true;
				nextTick(() => {
					songItemEditRef.value?.titleInputRef?.focus();
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
	if (
		navigation &&
		songItemFocusRef.value?.$el.value &&
		!props.isEncoreMarker
	) {
		navigation.registerElement(
			props.setIndex,
			"song",
			songItemFocusRef.value.$el.value,
			props.songIndex,
		);
		registeredSongIndex.value = props.songIndex;
		// Listen for custom event from navigation handler
		songItemFocusRef.value.$el.value.addEventListener(
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
			songItemFocusRef.value?.$el.value &&
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
				songItemFocusRef.value.$el.value,
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
	if (songItemFocusRef.value?.$el.value) {
		songItemFocusRef.value.$el.value.removeEventListener(
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
			editModeContext?.claim(editModeId.value);
			isEditing.value = true;
			nextTick(() => {
				songItemEditRef.value?.titleInputRef?.focus();
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
		editModeContext?.claim(editModeId.value);
		isEditing.value = true;
		nextTick(() => {
			songItemEditRef.value?.titleInputRef?.focus();
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
		editModeContext?.claim(editModeId.value);
		isEditing.value = true;
		nextTick(() => {
			songItemEditRef.value?.titleInputRef?.focus();
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
		<EncoreMarker
			v-if="isMarker"
			:is-last="markerIsLast"
			@reset="$emit('reset-encore')"
		/>

		<template v-else>
			<SongItemDisplay
				v-if="!isEditing"
				ref="songItemFocusRef"
				:song="song"
				:song-number="songNumber"
				:show-number="showNumber"
				:is-encore="isEncore"
				:tabindex="isEncoreMarker ? -1 : 0"
				@edit="
					editModeContext?.claim(editModeId);
					isEditing = true;
				"
				@remove="confirmRemove"
				@pointerdown="handlePointerDown"
				@pointermove="handlePointerMove"
				@pointerup="handlePointerUp"
				@pointercancel="handlePointerCancel"
				@focus="handleSongFocus"
				@keydown="handleSongKeyDown"
				@keyup="handleSongKeyUp"
			/>

			<SongItemEdit
				v-else
				ref="songItemEditRef"
				:title="editTitle"
				:song-key="editKey || ''"
				@save="
					({ title, key }) => {
						editTitle = title;
						editKey = key;
						save();
					}
				"
				@keyup-title="handleTitleKeyUp"
				@keyup-key="handleKeyInputKeyUp"
			/>
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
	--into-hover: 350ms ease-in;
	--into-hover-delay: 200ms;
	--into-hover-quick: 200ms ease-in;
	--out-of-hover: 100ms ease-out;

	margin-block-end: 0.15rem;
	display: flex;
	align-items: center;
	border-radius: 0.33em;
	border: 1px solid var(--border-color-ghost);
	transition:
		transform var(--out-of-hover),
		opacity var(--out-of-hover),
		max-height var(--out-of-hover),
		margin var(--out-of-hover),
		padding var(--out-of-hover);
	max-height: 100px;
	overflow: hidden;
	background-color: var(--bg-color-2);

	&.is-marker {
		background-color: var(--bg-color-accent);
		border: 1px dashed var(--accent-color);
		cursor: grab;
		padding: 0.35rem 0.75rem;
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

/* Hover effects for child components */
.song-item:hover :deep(.actions),
.song-item.is-focused :deep(.actions) {
	transition: opacity var(--into-hover) var(--into-hover-delay);
	opacity: 1;
}

.song-item:hover :deep(.grip),
.song-item.is-focused :deep(.grip) {
	transition: opacity var(--into-hover-quick);
	opacity: 0.75;
}

.song-item:hover :deep(.grip:hover) {
	opacity: 1;
}

@media (hover: none) {
	:deep(.actions) {
		opacity: 1;
	}

	:deep(.grip) {
		opacity: 0.5;
	}
}

:deep(.delete:hover) {
	color: #ff4444;
	border-color: #ff4444;
}

:deep(.view-mode:focus) {
	outline: none;
}

:deep(.view-mode:focus-visible) {
	outline: 2px solid var(--accent-color);
	outline-offset: 2px;
	border-radius: 4px;
}

.song-item.is-focused :deep(.view-mode) {
	background-color: rgba(100, 108, 255, 0.1);
	border-radius: 4px;
}
</style>
