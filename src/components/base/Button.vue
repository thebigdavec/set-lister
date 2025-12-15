<script setup lang="ts">
import { computed } from "vue";

const { size, nowrap, tooltip, disabled } = defineProps({
	size: {
		type: String,
		default: "md",
		validator: (value: string) =>
			["xs", "sm", "md", "lg", "xl"].includes(value),
	},
	nowrap: {
		type: Boolean,
		default: false,
	},
	tooltip: {
		type: String,
		default: "",
	},
	disabled: {
		type: Boolean,
		default: false,
	},
});

const buttonClasses = computed(() => ({
	[size]: true,
	nowrap: nowrap,
}));
</script>

<template>
	<Tooltip
		v-if="disabled === false && tooltip"
		:text="tooltip"
		position="bottom"
	>
		<button
			:class="buttonClasses"
			:disabled
			aria-label="Button"
			:aria-details="tooltip ? tooltip : 'Click me'"
		>
			<slot />
		</button>
	</Tooltip>
	<button v-else :class="buttonClasses" :disabled aria-label="button">
		<slot />
	</button>
</template>

<style scoped>
button {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5em;
	cursor: pointer;
	border-radius: 8px;
	border: 1px solid oklch(from var(--card-bg) calc(l * 2.5) c h);
	transition:
		border-color var(--exit-hover),
		background-color var(--exit-hover);
	background-color: var(--card-bg);
	color: var(--text-color);

	&.nowrap {
		flex-wrap: nowrap;
	}

	&.xs {
		font-size: 0.6rem;
		padding: 0.2em 0.4em;
	}

	&.sm {
		font-size: 0.8rem;
		padding: 0.4em 0.8em;
	}

	&.md {
		font-size: 1rem;
		padding: 0.6em 1.2em;
	}

	&.lg {
		font-size: 1.2rem;
		padding: 0.8em 1.6em;
	}

	&.xl {
		font-size: 1.4rem;
		padding: 1em 2em;
	}

	&:hover {
		border-color: #fff;
		transition:
			border-color var(--enter-hover),
			background-color var(--enter-hover);
	}

	&:disabled {
		color: #666;
		cursor: not-allowed;
		filter: blur(0);
		transition: filter var(--exit-hover);
		&:hover,
		&:focus-visible {
			border-color: #666;
			background-color: var(--card-bg);
			filter: blur(3px);
			transition: filter var(--enter-hover);
		}
	}

	&.primary {
		background-color: oklch(
			from var(--accent-color) calc(l * 0.8) c h / 0.7
		);
		color: white;

		&:hover {
			background-color: oklch(from var(--accent-color) calc(l * 1) c h);
			border-color: oklch(from var(--accent-color) calc(l * 1) c h);
			transition:
				border-color var(--enter-hover),
				background-color var(--enter-hover);
		}
	}

	&.danger {
		background-color: oklch(
			from var(--error-color) calc(l * 0.8) c h / 0.3
		);
		color: white;

		&:hover {
			background-color: oklch(from var(--error-color) calc(l * 0.8) c h);
			border-color: oklch(from var(--error-color) calc(l * 0.8) c h);
			transition:
				border-color var(--enter-hover),
				background-color var(--enter-hover);
		}
	}
}
</style>
