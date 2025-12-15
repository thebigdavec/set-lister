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
				<Lightbulb class="hint-icon" aria-hidden="true" />
			</Tooltip>
			<span class="hint-text">{{ text }}</span>
			<Button
				type="button"
				class="hint-dismiss"
				aria-label="Dismiss tip"
				tooltip="Dismiss tip"
				size="sm"
				@click="dismiss"
			>
				<X class="dismiss-icon" aria-hidden="true" />
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
	background: linear-gradient(
		135deg,
		rgba(100, 108, 255, 0.15),
		rgba(161, 100, 255, 0.15)
	);
	border: 1px solid rgba(100, 108, 255, 0.3);
	border-radius: 6px;
	font-size: 0.85rem;
	color: #ddd;
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
	flex-shrink: 0;
	width: 16px;
	height: 16px;
	color: #a164ff;
}

.hint-text {
	flex: 1;
}

.hint-dismiss {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	padding: 0;
	background: transparent;
	border: none;
	border-radius: 4px;
	color: #888;
	cursor: pointer;
	transition:
		color 0.15s ease,
		background-color 0.15s ease;
}

.hint-dismiss:hover {
	color: #fff;
	background-color: rgba(255, 255, 255, 0.1);
}

.hint-dismiss:focus-visible {
	outline: 2px solid var(--accent-color);
	outline-offset: 2px;
}

.dismiss-icon {
	width: 14px;
	height: 14px;
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
