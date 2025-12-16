<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { Check } from 'lucide-vue-next'
	import { LIMITS } from '../../constants/limits'

	const props = defineProps<{
		title: string
		songKey: string
	}>()

	const emit = defineEmits<{
		(e: 'save', payload: { title: string; key: string }): void
		(e: 'keyup-title', event: KeyboardEvent): void
		(e: 'keyup-key', event: KeyboardEvent): void
	}>()

	const titleInputRef = ref<HTMLInputElement | null>(null)
	const editTitle = ref(props.title)
	const editKey = ref(props.songKey)

	// Sync with props
	watch(
		() => props.title,
		(newTitle) => {
			editTitle.value = newTitle
		},
	)

	watch(
		() => props.songKey,
		(newKey) => {
			editKey.value = newKey
		},
	)

	function handleSave() {
		emit('save', {
			title: editTitle.value,
			key: editKey.value,
		})
	}

	// Expose the title input ref for parent to focus
	defineExpose({
		titleInputRef,
	})
</script>

<template>
	<div class="edit-mode no-print">
		<input ref="titleInputRef" v-model="editTitle" :maxlength="LIMITS.MAX_SONG_TITLE_LENGTH"
			placeholder="Song Title" @keyup="$emit('keyup-title', $event)" />
		<input v-model="editKey" :maxlength="LIMITS.MAX_SONG_KEY_LENGTH" placeholder="Song Key" class="key-input"
			@keyup="$emit('keyup-key', $event)" />
		<Button class="success" size="sm" @click="handleSave">
			<Check class="icon" /> Done
		</Button>
	</div>
</template>

<style scoped>
	.edit-mode {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		align-items: center;
		width: 100%;
	}

	.edit-mode input {
		padding: 0.5rem;
		border: 1px solid #444;
		background: #2a2a2a;
		color: #fff;
		border-radius: 4px;
		font-size: 1rem;
		outline: none;
	}

	.edit-mode input:focus {
		border-color: var(--accent-color);
	}

	.edit-mode input:first-of-type {
		flex: 1;
		min-width: 0;
	}

	.key-input {
		width: 6rem;
		flex-shrink: 0;
	}
</style>
