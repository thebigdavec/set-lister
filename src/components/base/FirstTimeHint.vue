<script setup lang="ts">
import { ref, onMounted } from "vue";
import { X, Lightbulb } from "lucide-vue-next";
import { STORAGE_KEYS } from "../../constants";

const props = withDefaults(
	defineProps<{
		/** Unique identifier for this hint (used for localStorage) */
		hintId: string;
		/** The tip text to display */
		text: string;
		/** Position of the hint */
		position?: "inline" | "above" | "below";
	}>(),
	{
		position: "inline",
	},
);

const isVisible = ref(false);

function getDismissedHints(): string[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.DISMISSED_HINTS);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function saveDismissedHints(hints: string[]): void {
	localStorage.setItem(STORAGE_KEYS.DISMISSED_HINTS, JSON.stringify(hints));
}

function dismiss(): void {
	isVisible.value = false;
	const dismissed = getDismissedHints();
	if (!dismissed.includes(props.hintId)) {
		dismissed.push(props.hintId);
		saveDismissedHints(dismissed);
	}
}

onMounted(() => {
	const dismissed = getDismissedHints();
	isVisible.value = !dismissed.includes(props.hintId);
});
</script>

<template>
	<Transition name="hint-fade">
		<div
			v-if="isVisible"
			class="first-time-hint no-print"
			:class="[`hint-${position}`]"
			role="status"
			aria-live="polite"
		>
			<Tooltip text="Here's a little tip for you!" position="bottom">
				<Lightbulb class="icon hint-icon" aria-hidden="true" />
			</Tooltip>
			<span class="hint-text">{{ text }}</span>
			<Button
				type="button"
				aria-label="Dismiss tip"
				tooltip="Dismiss tip"
				size="sm"
				@click="dismiss"
			>
				<X class="icon" aria-hidden="true" />
			</Button>
		</div>
	</Transition>
</template>

<style scoped>
.first-time-hint {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	background-color: var(--bg-color-accent);
	border-radius: 6px;
	font-size: 0.85rem;
	line-height: 1.4;
}

.hint-inline {
	margin: 0.5rem 0;
}

.hint-above {
	margin-bottom: 0.5rem;
}

.hint-below {
	margin-top: 0.5rem;
}

.hint-icon {
	color: var(--accent-color);
}

.hint-text {
	flex: 1;
}

/* Fade transition */
.hint-fade-enter-active,
.hint-fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
	.hint-fade-enter-active,
	.hint-fade-leave-active {
		transition: opacity 0.15s ease;
	}

	.hint-fade-enter-from,
	.hint-fade-leave-to {
		transform: none;
	}
}
</style>
