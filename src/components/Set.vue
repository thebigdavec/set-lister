<script setup lang="ts">
import {
	computed,
	inject,
	nextTick,
	onMounted,
	onUnmounted,
	provide,
	readonly,
	ref,
	toRef,
	watch,
} from "vue";
import { Plus, Trash } from "lucide-vue-next";
import Sortable, { MoveEvent, SortableEvent } from "sortablejs";
import SongItem from "./SongItem.vue";
import AddSongModal from "./AddSongModal.vue";
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
import { LIMITS } from "../constants/limits";

const props = defineProps<{
	set: SetItem;
	setIndex: number;
	isLast: boolean;
	showSongNumbers?: boolean;
}>();

// Use the consolidated encore helpers
const { markerIndex, hasEncoreMarker, markerIsLast, isEncoreSongByIndex } =
	useEncoreHelpers({
		set: toRef(props, "set"),
		isLast: toRef(props, "isLast"),
	});

// Compute the display name (custom name or dynamic "Set #")
const displayName = computed(() => getSetDisplayName(props.set.id));

// State for editing the set name
const isEditingName = ref(false);
const editingNameValue = ref<string | undefined>(props.set.name);

// Watch for changes to the set name from external sources
watch(
	() => props.set.name,
	(newName) => {
		if (!isEditingName.value) {
			editingNameValue.value = newName;
		}
	},
);

// Compute song numbers (excluding encore markers)
// Returns a map of songIndex -> displayNumber
const songNumbers = computed(() => {
	const numbers = new Map<number, number>();
	let count = 0;
	props.set.songs.forEach((song, index) => {
		if (!isEncoreMarkerSong(song)) {
			count++;
			numbers.set(index, count);
		}
	});
	return numbers;
});

// Inject navigation context from SetList
const navigation = inject<UseSetlistNavigationReturn>("setlistNavigation");

// Edit mode management - only one SongItem can be in edit mode at a time
const activeEditId = ref<string | null>(null);

function claimEditMode(id: string): void {
	activeEditId.value = id;
}

function releaseEditMode(id: string): void {
	if (activeEditId.value === id) {
		activeEditId.value = null;
	}
}

// Provide edit mode context to child components
provide("editModeContext", {
	activeEditId: readonly(activeEditId),
	claim: claimEditMode,
	release: releaseEditMode,
});

const songListRef = ref<HTMLDivElement | null>(null);
const setNameRef = ref<HTMLInputElement | null>(null);
const addSongButtonRef = ref<HTMLButtonElement | null>(null);
let sortableInstance: Sortable | null = null;

// Track if delete confirmation dialog is shown
const showDeleteConfirm = ref(false);

// Track if add song modal is shown
const showAddSongModal = ref(false);

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
async function handleSetNameFocus(): Promise<void> {
	isEditingName.value = true;
	if (navigation) {
		navigation.setFocus({ setIndex: props.setIndex, type: "name" });
	}
	// Wait for the input to be rendered, then focus it
	await nextTick();
	setNameRef.value?.focus();
	setNameRef.value?.select();
}

// Handle keydown on set name (when not editing)
function handleSetNameKeyDown(event: KeyboardEvent): void {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		handleSetNameFocus();
	}
}

const encoreSummary = computed(() => {
	if (!props.isLast) return "Encore marker appears only in the final set.";
	if (props.set.songs.length < 2)
		return "Add two or more songs to unlock encores.";
	if (!hasEncoreMarker.value)
		return "Encore marker will appear automatically when eligible.";
	return "Drag the <encore> entry to choose where encores begin.";
});

function openAddSongModal(): void {
	showAddSongModal.value = true;
}

function closeAddSongModal(): void {
	showAddSongModal.value = false;
	// Return focus to the add song button
	nextTick(() => {
		addSongButtonRef.value?.focus();
	});
}

function handleAddSong(payload: {
	setId: string;
	title: string;
	key: string;
}): void {
	addSongToSet(payload.setId, { title: payload.title, key: payload.key });
}

function handleTitleBlur(): void {
	if (editingNameValue.value !== undefined) {
		renameSet(props.set.id, editingNameValue.value);
	}
	isEditingName.value = false;
}

function handleTitleKeyDown(event: KeyboardEvent): void {
	if (event.key === "Enter") {
		event.preventDefault();
		(event.target as HTMLInputElement)?.blur();
	} else if (event.key === "Escape") {
		event.preventDefault();
		editingNameValue.value = props.set.name;
		(event.target as HTMLInputElement)?.blur();
	}
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

const emit = defineEmits<{ (e: "remove-set"): void }>();

function handleDeleteClick(): void {
	showDeleteConfirm.value = true;
}

function confirmDelete(): void {
	showDeleteConfirm.value = false;
	emit("remove-set");
}

function cancelDelete(): void {
	showDeleteConfirm.value = false;
}
</script>

<template>
	<div class="set-container card">
		<div class="set-header">
			<div class="set-name-wrapper">
				<h2
					v-if="!isEditingName"
					tabindex="0"
					:class="{
						'is-focused': navigation?.isFocused(setIndex, 'name'),
					}"
					@click="handleSetNameFocus"
					@focus="handleSetNameFocus"
					@keydown="handleSetNameKeyDown"
				>
					{{ displayName }}
				</h2>
				<input
					v-else
					ref="setNameRef"
					v-model="editingNameValue"
					type="text"
					class="set-name-input"
					:maxlength="LIMITS.MAX_SET_NAME_LENGTH"
					:placeholder="displayName"
					@blur="handleTitleBlur"
					@keydown="handleTitleKeyDown"
				/>
			</div>
			<div class="set-header-actions no-print">
				<Button
					ref="addSongButtonRef"
					@click="openAddSongModal"
					class="primary"
					aria-label="Add song"
					size="sm"
					tooltip="Add a new song to this set"
				>
					<Plus class="icon" />
					Add Song
				</Button>
				<Button
					@click="handleDeleteClick"
					class="danger"
					aria-label="Delete set"
					size="sm"
					tooltip="Delete this set and all its songs"
				>
					<Trash class="icon" />
					Delete Set
				</Button>
			</div>
		</div>

		<FirstTimeHint
			v-if="setIndex === 0 && set.songs.length > 0"
			hint-id="reorder-songs"
			text="Tip: Use the grip icon to reorder songs and move the encore marker."
			position="above"
		/>

		<div ref="songListRef" class="song-list" :data-set-id="set.id">
			<SongItem
				v-for="(song, index) in set.songs"
				:key="song.id"
				:song="song"
				:set-index="setIndex"
				:song-index="index"
				:song-number="songNumbers.get(index)"
				:show-number="showSongNumbers"
				:is-encore="songIsEncore(index)"
				:is-encore-marker="song.isEncoreMarker === true"
				:marker-is-last="markerIsLast"
				@update="(updates) => updateSong(set.id, song.id, updates)"
				@remove="removeSongFromSet(set.id, song.id)"
				@reset-encore="resetEncoreMarker"
			/>
		</div>

		<p v-if="set.songs.length === 0" class="empty-set-message no-print">
			No songs yet. Click "Add Song" to get started.
		</p>

		<div v-if="isLast" class="encore-actions no-print">
			<p class="marker-hint">{{ encoreSummary }}</p>
		</div>

		<AddSongModal
			:show="showAddSongModal"
			:default-set-id="set.id"
			@close="closeAddSongModal"
			@add="handleAddSong"
		/>

		<ConfirmDialog
			:show="showDeleteConfirm"
			title="Delete Set"
			:message="`Are you sure you want to delete '${displayName}'? This action cannot be undone.`"
			confirm-text="Delete"
			:danger="true"
			@confirm="confirmDelete"
			@cancel="cancelDelete"
		/>
	</div>
</template>

<style scoped>
.set-container {
	display: flex;
	flex-direction: column;
}

.set-header {
	display: flex;
	position: sticky;
	top: 0;
	z-index: 1;
	backdrop-filter: blur(5px);
	justify-content: space-between;
	align-items: center;
	padding-block: 0.5rem;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.set-name-wrapper {
	flex: 1;
	min-width: 0;
}

.set-header h2 {
	margin: 0;
	outline: none;
	border-bottom: 2px solid transparent;
	transition: border-bottom-color 0.3s ease;
	cursor: pointer;
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

.set-name-input {
	width: 100%;
	font-size: 2em;
	font-weight: bold;
	background: transparent;
	border: none;
	border-bottom: 2px solid var(--accent-color);
	color: inherit;
	padding: 0.25rem 0;
	outline: none;
	font-family: inherit;
}

.set-name-input::placeholder {
	color: #888;
	opacity: 0.6;
}

.set-header-actions {
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
}

.song-list {
	min-height: 50px;
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
}

.sortable-ghost {
	opacity: 0.5;
	background-color: var(--bg-color-ghost);
	border: 3px dashed var(--accent-color);
}

.empty-set-message {
	text-align: center;
	color: var(--text-color-ghost);
	padding: 1rem;
	font-style: italic;
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
	color: var(--text-color-ghost);
}
</style>
