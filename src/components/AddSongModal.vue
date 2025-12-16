<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { Check, X } from "lucide-vue-next";
import { store, getSetDisplayName } from "../store";
import { LIMITS } from "../constants/limits";

const props = defineProps<{
	show: boolean;
	defaultSetId?: string;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "add", payload: { setId: string; title: string; key: string }): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);

const songTitle = ref("");
const songKey = ref("");
const selectedSetId = ref("");

// Compute available sets for the dropdown
const availableSets = computed(() =>
	store.sets.map((set, index) => ({
		id: set.id,
		displayName: `${index + 1}. ${getSetDisplayName(set.id)}`,
	})),
);

// Show set selector only when there's more than one set
const showSetSelector = computed(() => store.sets.length > 1);

// Watch for show prop changes to open/close dialog
watch(
	() => props.show,
	(newValue) => {
		if (newValue) {
			openDialog();
		} else {
			closeDialog();
		}
	},
);

// Watch for defaultSetId changes - update when modal opens
watch(
	() => props.defaultSetId,
	(newValue) => {
		if (newValue && props.show) {
			selectedSetId.value = newValue;
		}
	},
);

function openDialog(): void {
	// Set the selected set - prefer defaultSetId, fall back to last set
	if (props.defaultSetId) {
		selectedSetId.value = props.defaultSetId;
	} else if (store.sets.length > 0) {
		selectedSetId.value = store.sets[store.sets.length - 1].id;
	}

	dialogRef.value?.showModal();

	nextTick(() => {
		titleInputRef.value?.focus();
	});
}

function closeDialog(): void {
	dialogRef.value?.close();
}

function handleClose(): void {
	resetForm();
	emit("close");
}

function resetForm(): void {
	songTitle.value = "";
	songKey.value = "";
}

function handleSubmit(): void {
	if (!songTitle.value.trim()) {
		handleClose();
		return;
	}

	emit("add", {
		setId: selectedSetId.value,
		title: songTitle.value.trim(),
		key: songKey.value.trim(),
	});

	resetForm();

	// Focus back to title input for adding more songs
	nextTick(() => {
		titleInputRef.value?.focus();
	});
}

function handleSubmitAndClose(): void {
	handleSubmit();
	handleClose();
}

function handleKeyDown(event: KeyboardEvent): void {
	if (event.key === "Escape") {
		event.preventDefault();
		handleClose();
	}
}

function handleBackdropClick(event: MouseEvent): void {
	// Close if clicking on the backdrop (dialog element itself, not its contents)
	if (event.target === dialogRef.value) {
		handleClose();
	}
}

onMounted(() => {
	if (props.show) {
		openDialog();
	}
});

onUnmounted(() => {
	closeDialog();
});
</script>

<template>
	<dialog
		ref="dialogRef"
		class="add-song-dialog"
		@keydown="handleKeyDown"
		@click="handleBackdropClick"
	>
		<div class="dialog-content">
			<div class="dialog-header">
				<h3>Add Song</h3>
				<Button
					type="button"
					class="danger"
					size="sm"
					@click="handleClose"
					aria-label="Close dialog"
					tooltip="Close"
				>
					<X class="icon" />
				</Button>
			</div>

			<form @submit.prevent="handleSubmit" class="dialog-form">
				<div class="form-group">
					<label for="song-title">Song title</label>
					<input
						id="song-title"
						ref="titleInputRef"
						v-model="songTitle"
						type="text"
						:maxlength="LIMITS.MAX_SONG_TITLE_LENGTH"
						placeholder="Enter song title"
						autocomplete="off"
					/>
				</div>

				<div class="form-group">
					<label for="song-key">Song key</label>
					<input
						id="song-key"
						v-model="songKey"
						type="text"
						:maxlength="LIMITS.MAX_SONG_KEY_LENGTH"
						placeholder="e.g., Am, C, F#m"
						autocomplete="off"
					/>
				</div>

				<div v-if="showSetSelector" class="form-group">
					<label for="set-select">Add to set...</label>
					<select id="set-select" v-model="selectedSetId">
						<option
							v-for="set in availableSets"
							:key="set.id"
							:value="set.id"
						>
							{{ set.displayName }}
						</option>
					</select>
				</div>

				<div class="dialog-actions">
					<Button type="button" @click="handleSubmitAndClose">
						{{ songTitle.trim() ? "Add and " : "" }}Close
					</Button>
					<Button
						v-if="songTitle.trim()"
						type="submit"
						:class="{ success: songTitle.trim() }"
					>
						<Check class="icon" /> Add
					</Button>
				</div>
			</form>
		</div>
	</dialog>
</template>

<style scoped>
.add-song-dialog {
	border: none;
	border-radius: 8px;
	padding: 0;
	background: #333;
	color: var(--text-color);
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	max-width: 400px;
	width: 90%;
}

.add-song-dialog::backdrop {
	background: rgba(0, 0, 0, 0.7);
}

.dialog-content {
	padding: 1.5rem;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: top;
	margin-bottom: 1.5rem;
}

.dialog-header h3 {
	margin: 0;
	color: white;
	font-size: 1.25rem;
}

.dialog-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.form-group label {
	font-size: 0.875rem;
	color: #ccc;
}

.form-group input,
.form-group select {
	background-color: var(--card-bg);
	border: 1px solid var(--border-color);
	color: var(--text-color);
	padding: 0.75rem;
	border-radius: 4px;
	font-size: 1rem;
	width: 100%;
	box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: var(--accent-color);
}

.form-group select {
	cursor: pointer;
}

.dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 0.5rem;
}

/* Icon sizing */
.icon {
	width: 1em;
	height: 1em;
}
</style>
