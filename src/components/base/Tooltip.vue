<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useTooltipState } from "../../composables/useTooltipState";

const { markTooltipSeen, getShowDelay } = useTooltipState();

const props = withDefaults(
	defineProps<{
		/** The tooltip content text */
		text?: string;
		/** Position preference for the tooltip */
		position?: "top" | "bottom" | "left" | "right";
		/** Delay before showing tooltip (ms) */
		showDelay?: number;
		/** Delay before hiding tooltip (ms) */
		hideDelay?: number;
		/** Disable the tooltip */
		disabled?: boolean;
	}>(),
	{
		text: "",
		position: "top",
		showDelay: undefined, // Will use dynamic delay from global state
		hideDelay: 150,
		disabled: false,
	},
);

const isVisible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const anchorName = ref(
	`--tooltip-anchor-${Math.random().toString(36).slice(2, 11)}`,
);

let showTimeout: ReturnType<typeof setTimeout> | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

// Get the tooltip text from either prop or title attribute of slotted element
const tooltipText = computed(() => {
	if (props.text) return props.text;
	// Try to get title from the trigger element
	const trigger = triggerRef.value?.querySelector(
		"[title]",
	) as HTMLElement | null;
	return trigger?.getAttribute("title") || "";
});

// Computed position-area based on position prop
const positionArea = computed(() => {
	switch (props.position) {
		case "top":
			return "top";
		case "bottom":
			return "bottom";
		case "left":
			return "left";
		case "right":
			return "right";
		default:
			return "top";
	}
});

function clearTimeouts(): void {
	if (showTimeout) {
		clearTimeout(showTimeout);
		showTimeout = null;
	}
	if (hideTimeout) {
		clearTimeout(hideTimeout);
		hideTimeout = null;
	}
}

function show(): void {
	if (props.disabled || !tooltipText.value) return;
	clearTimeouts();
	// Use explicit prop if provided, otherwise use adaptive delay from global state
	const delay = props.showDelay ?? getShowDelay();
	showTimeout = setTimeout(() => {
		isVisible.value = true;
		// Mark that a tooltip has been seen for faster subsequent tooltips
		markTooltipSeen();
	}, delay);
}

function hide(): void {
	clearTimeouts();
	hideTimeout = setTimeout(() => {
		isVisible.value = false;
	}, props.hideDelay);
}

function handleFocus(): void {
	show();
}

function handleBlur(): void {
	hide();
}

function handleMouseEnter(): void {
	show();
}

function handleMouseLeave(): void {
	hide();
}

function handleKeyDown(event: KeyboardEvent): void {
	// Hide tooltip on Escape key
	if (event.key === "Escape" && isVisible.value) {
		clearTimeouts();
		isVisible.value = false;
	}
}

// Remove title attribute from elements to prevent native tooltip
function removeTitleAttributes(): void {
	if (!triggerRef.value) return;
	const elementsWithTitle = triggerRef.value.querySelectorAll("[title]");
	elementsWithTitle.forEach((el) => {
		const title = el.getAttribute("title");
		if (title) {
			el.setAttribute("data-original-title", title);
			el.removeAttribute("title");
		}
	});
}

// Restore title attributes when component unmounts
function restoreTitleAttributes(): void {
	if (!triggerRef.value) return;
	const elementsWithDataTitle = triggerRef.value.querySelectorAll(
		"[data-original-title]",
	);
	elementsWithDataTitle.forEach((el) => {
		const title = el.getAttribute("data-original-title");
		if (title) {
			el.setAttribute("title", title);
			el.removeAttribute("data-original-title");
		}
	});
}

onMounted(() => {
	nextTick(() => {
		removeTitleAttributes();
	});
	window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	clearTimeouts();
	restoreTitleAttributes();
	window.removeEventListener("keydown", handleKeyDown);
});

// Watch for text prop changes
watch(
	() => props.text,
	() => {
		nextTick(() => {
			removeTitleAttributes();
		});
	},
);
</script>

<template>
	<div
		ref="triggerRef"
		class="tooltip-trigger"
		:style="{ anchorName: anchorName }"
		@mouseenter="handleMouseEnter"
		@mouseleave="handleMouseLeave"
		@focusin="handleFocus"
		@focusout="handleBlur"
	>
		<slot />
		<Teleport to="body">
			<Transition name="tooltip-fade">
				<div
					v-if="isVisible && tooltipText"
					ref="tooltipRef"
					class="tooltip"
					:class="[`tooltip-${position}`]"
					:style="{ positionAnchor: anchorName }"
					role="tooltip"
					:aria-hidden="!isVisible"
				>
					<span class="tooltip-content">{{ tooltipText }}</span>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.tooltip-trigger {
	display: inline-block;
	anchor-name: v-bind(anchorName);

	@media print {
		display: none;
	}
}

.tooltip {
	position: fixed;
	position-anchor: v-bind(anchorName);
	z-index: 9999;
	pointer-events: none;
	max-width: 300px;
	width: max-content;
	font-style: italic;

	/* Fallback positioning for browsers without anchor positioning support */
	@supports not (anchor-name: --test) {
		position: absolute;
	}

	@media print {
		display: none;
	}
}

/* Position variations using CSS anchor positioning */
.tooltip-top {
	position-area: top;
	margin-bottom: 8px;
	justify-self: anchor-center;
}

.tooltip-bottom {
	position-area: bottom;
	margin-top: 8px;
	justify-self: anchor-center;
}

.tooltip-left {
	position-area: left;
	margin-right: 8px;
	align-self: anchor-center;
}

.tooltip-right {
	position-area: right;
	margin-left: 8px;
	align-self: anchor-center;
}

.tooltip-content {
	display: block;
	background-color: var(--tooltip-bg);
	color: var(--tooltip-text);
	padding: 0.5em 0.75em;
	border-radius: 6px;
	border: 1px solid var(--border-color);
	font-size: 0.85rem;
	line-height: 1.4;
	box-shadow: 0 4px 12px var(--shadow-color);
	text-align: center;
	word-wrap: break-word;
}

/* Fade transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
	transition:
		opacity 0.15s ease,
		transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
	opacity: 0;
}

.tooltip-fade-enter-from.tooltip-top,
.tooltip-fade-leave-to.tooltip-top {
	transform: translateY(4px);
}

.tooltip-fade-enter-from.tooltip-bottom,
.tooltip-fade-leave-to.tooltip-bottom {
	transform: translateY(-4px);
}

.tooltip-fade-enter-from.tooltip-left,
.tooltip-fade-leave-to.tooltip-left {
	transform: translateX(4px);
}

.tooltip-fade-enter-from.tooltip-right,
.tooltip-fade-leave-to.tooltip-right {
	transform: translateX(-4px);
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
	.tooltip-fade-enter-active,
	.tooltip-fade-leave-active {
		transition: opacity 0.1s ease;
	}

	.tooltip-fade-enter-from,
	.tooltip-fade-leave-to {
		transform: none;
	}
}
</style>
