<script setup lang="ts">
import { computed, inject, ref, watch, type DeepReadonly, type Ref } from "vue";
import { Check } from "lucide-vue-next";

// Type for edit mode context provided by Set.vue
interface EditModeContext {
	activeEditId: DeepReadonly<Ref<string | null>>;
	claim: (id: string) => void;
	release: (id: string) => void;
}

const props = defineProps<{
	songCount: number;
}>();

const emit = defineEmits<{
	(e: "add", payload: { title: string; key: string }): void;
}>();

const titleInputRef = ref<HTMLInputElement | null>(null);
const keyInputRef = ref<HTMLInputElement | null>(null);
const newSongTitle = ref("");
const newSongKey = ref("");

// Inject edit mode context from Set.vue
const editModeContext = inject<EditModeContext>("editModeContext");

// Unique ID for this AddSong's edit mode
const editModeId = computed(() => `add-song-${props.songCount}`);

// Track if we're in edit mode (input is focused)
const isEditMode = ref(false);

// Watch for another component claiming edit mode
watch(
	() => editModeContext?.activeEditId.value,
	(newId) => {
		if (newId !== null && newId !== editModeId.value && isEditMode.value) {
			// Another component claimed edit mode, blur our inputs
			titleInputRef.value?.blur();
			keyInputRef.value?.blur();
			isEditMode.value = false;
		}
	},
);

function handleInputFocus(): void {
	if (!isEditMode.value) {
		editModeContext?.claim(editModeId.value);
		isEditMode.value = true;
	}
}

function handleInputBlur(event: FocusEvent): void {
	// Check if focus is moving to another input within this component
	const relatedTarget = event.relatedTarget as HTMLElement | null;
	const isInternalFocusChange =
		relatedTarget === titleInputRef.value ||
		relatedTarget === keyInputRef.value;

	if (!isInternalFocusChange) {
		isEditMode.value = false;
		editModeContext?.release(editModeId.value);
	}
}

function addSong(): void {
	if (!newSongTitle.value.trim()) return;

	emit("add", {
		title: newSongTitle.value,
		key: newSongKey.value,
	});

	newSongTitle.value = "";
	newSongKey.value = "";

	titleInputRef.value?.focus();
}

defineExpose({
	focusTitleInput: () => titleInputRef.value?.focus(),
});
</script>

<template>
	<div class="add-song no-print">
		Add {{ songCount === 0 ? "first" : "next" }} song
		<div class="add-song-form">
			<input
				ref="titleInputRef"
				name="songTitle"
				v-model="newSongTitle"
				placeholder="Song Title"
				@keyup.enter="addSong"
				@focus="handleInputFocus"
				@blur="handleInputBlur"
			/>
			<input
				ref="keyInputRef"
				name="songKey"
				v-model="newSongKey"
				placeholder="Song Key"
				class="key-input"
				@keyup.enter="addSong"
				@focus="handleInputFocus"
				@blur="handleInputBlur"
			/>
			<Button
				v-if="newSongTitle.length"
				class="success"
				size="sm"
				@click="addSong"
				tooltip="Add song to end of set"
			>
				<Check class="icon" /> Add
			</Button>
		</div>
	</div>
</template>

<style scoped>
.add-song {
	text-align: center;
	color: #bbbbbb;
	background: #333;
	padding: 0.5rem;
	margin-block-end: 0.5rem;
	border-block-end: 2px solid #242424;
	border-radius: 3px;

	.add-song-form {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.25rem;
		flex-wrap: wrap;

		input {
			border-color: var(--accent-color);

			&:not(.key-input) {
				flex: 1;
			}
		}
	}
}
</style>
