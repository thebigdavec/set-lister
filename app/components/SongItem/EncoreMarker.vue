<script setup lang="ts">
import { GripVertical, RotateCcw } from "lucide-vue-next";

defineProps<{
	isLast: boolean;
}>();

defineEmits<{
	(e: "reset"): void;
}>();
</script>

<template>
	<BaseTooltip text="Grab to reorder" position="top">
		<GripVertical class="grip" />
	</BaseTooltip>
	<div class="marker-pill">Start of Encore section</div>
	<BaseButton
		v-if="!isLast"
		size="sm"
		class="icon-btn no-print marker-reset-btn"
		type="button"
		tooltip="Reset encore marker to end"
		aria-label="Reset encore marker to end"
		@click.stop.prevent="$emit('reset')"
	>
		<RotateCcw class="icon" />
	</BaseButton>
</template>

<style scoped>
.grip {
	cursor: grab;
	flex-shrink: 0;
	color: var(--text-on-dark);
}

.marker-pill {
	font-style: italic;
	font-size: 0.9rem;
	flex: 1;
	text-align: center;
}

.marker-reset-btn {
	flex-shrink: 0;
}
</style>
