<script setup lang="ts">
import { ref } from "vue";
import { GripVertical, Pencil, X } from "lucide-vue-next";
import type { Song } from "../../store";

defineProps<{
	song: Song;
	songNumber?: number;
	showNumber?: boolean;
	isEncore?: boolean;
	tabindex?: number;
}>();

defineEmits<{
	(e: "edit"): void;
	(e: "remove"): void;
	(e: "pointerdown", event: PointerEvent): void;
	(e: "pointermove", event: PointerEvent): void;
	(e: "pointerup", event: PointerEvent): void;
	(e: "pointercancel", event: PointerEvent): void;
	(e: "focus"): void;
	(e: "keydown", event: KeyboardEvent): void;
	(e: "keyup", event: KeyboardEvent): void;
}>();

const rootRef = ref<HTMLDivElement | null>(null);

// Expose root element for parent component
defineExpose({
	$el: rootRef,
});
</script>

<template>
	<div
		ref="rootRef"
		class="view-mode"
		:tabindex="tabindex"
		@pointerdown="$emit('pointerdown', $event)"
		@pointermove="$emit('pointermove', $event)"
		@pointerup="$emit('pointerup', $event)"
		@pointercancel="$emit('pointercancel', $event)"
		@focus="$emit('focus')"
		@keydown="$emit('keydown', $event)"
		@keyup="$emit('keyup', $event)"
	>
		<Tooltip text="Grab to reorder" position="top">
			<GripVertical class="grip" />
		</Tooltip>
		<span v-if="showNumber && songNumber" class="song-number">{{
			songNumber
		}}</span>
		<div class="song-content">
			<span class="song-title">{{ song.title }}</span>
			<span v-if="song.key" class="song-key">({{ song.key }})</span>
		</div>
		<div class="song-meta">
			<span v-if="isEncore" class="encore-pill">Encore</span>
			<div class="actions no-print">
				<Button
					@click="$emit('edit')"
					size="sm"
					tooltip="Edit song"
					aria-label="Edit song"
				>
					<Pencil class="icon" />
				</Button>
				<Button
					@click="$emit('remove')"
					size="sm"
					class="delete"
					tooltip="Remove song from this set"
					aria-label="Remove song from this set"
				>
					<X class="icon" />
				</Button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.view-mode {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	outline: none;
	width: 100%;
}

.grip {
	cursor: grab;
	color: var(--text-color-ghost);
	flex-shrink: 0;
}

.song-number {
	font-weight: 600;
	color: var(--accent-color);
	background-color: var(--bg-color-accent-ghost);
	display: grid;
	min-width: 2rem;
	aspect-ratio: 1;
	place-items: center;
	border-radius: 0.5rem;
}

.song-content {
	flex: 1;
	display: flex;
	gap: 0.5rem;
	align-items: baseline;
	min-width: 0;
}

.song-title {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.song-key {
	color: var(--text-color-muted);
	flex-shrink: 0;
	font-size: 0.9rem;
}

.song-meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}

.encore-pill {
	background: var(--bg-color-accent);
	border: 1px solid var(--border-color);
	padding: 0.25rem 1rem;
	border-radius: 1rem;
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
}

.actions {
	display: flex;
	gap: 0.25rem;
}
</style>
