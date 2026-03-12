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
	<div ref="rootRef" class="view-mode" :tabindex="tabindex" @pointerdown="$emit('pointerdown', $event)"
		@pointermove="$emit('pointermove', $event)" @pointerup="$emit('pointerup', $event)"
		@pointercancel="$emit('pointercancel', $event)" @focus="$emit('focus')" @keydown="$emit('keydown', $event)"
		@keyup="$emit('keyup', $event)">
		<span v-if="showNumber && songNumber" class="song-number">{{
			songNumber
		}}</span>
		<div class="song-content">
			<span class="song-title">{{ song.title }}</span>
			<span v-if="song.key" class="song-key"> ({{ song.key }})</span>
		</div>
		<div class="song-meta">
			<!-- Actions are intentionally hidden in WYSIWYG display mode to behave like a sheet of paper.
			     Hovering should not show pencil or drag icons. User will click to enter edit mode. -->
		</div>
	</div>
</template>

<style scoped>
.view-mode {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0;
	margin: 0;
	outline: none;
	width: 100%;
	white-space: nowrap;
	background-color: transparent;
}

.grip {
	cursor: grab;
	color: #ccc;
	flex-shrink: 0;
}

.song-number {
	font-weight: bold;
	color: black;
	min-width: 1.5em;
	text-align: right;
	margin-right: 0.5em;
	font-size: 1em;
}

.song-content {
	flex: 1;
	min-width: 0;
	color: black;
	font-size: 1em;
	line-height: inherit;
	white-space: nowrap;
	background-color: transparent;
	overflow: hidden;
	text-overflow: ellipsis;
}

.song-title {
	font-weight: 500;
}

.song-key {
	color: #333;
	font-size: 0.9em;
}

.song-meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-shrink: 0;
}

/* Actions are removed entirely from the DOM in WYSIWYG but keeping the class just in case */
.actions {
	display: none;
}
</style>
