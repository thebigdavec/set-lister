<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({
	inheritAttrs: false,
});

const attrs = useAttrs();

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
			v-bind="attrs"
			:class="[buttonClasses, attrs.class]"
			:disabled
			aria-label="Button"
			:aria-details="tooltip ? tooltip : 'Click me'"
		>
			<slot />
		</button>
	</Tooltip>
	<button
		v-else
		v-bind="attrs"
		:class="[buttonClasses, attrs.class]"
		:disabled
		aria-label="button"
	>
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
	border: 1px solid var(--border-color);
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

	&:hover,
	&:focus-visible {
		border-color: var(--border-color-hover);
		background-color: var(--card-bg-hover);
		color: var(--text-color-hover);

		transition:
			border-color var(--enter-hover),
			background-color var(--enter-hover);
	}

	&:active {
		border-color: var(--border-color-active);
		background-color: var(--card-bg-active);
		color: var(--text-color-active);

		transition:
			border-color var(--enter-active),
			background-color var(--enter-active);
	}

	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		filter: blur(0);
		transition: filter var(--exit-hover);
		border-color: transparent;
		color: var(--text-color-2);

		&:hover,
		&:focus-visible {
			filter: blur(3px);
			transition: filter var(--enter-hover);
		}
	}

	&.primary {
		background-color: var(--accent-color);
		color: white;

		&:hover,
		&:focus-visible {
			background-color: var(--accent-color-hover);
			border-color: var(--accent-color-hover);
			transition:
				border-color var(--enter-hover),
				background-color var(--enter-hover);
		}

		&:active {
			border-color: var(--accent-color-active);
			background-color: var(--accent-color-active);
			color: var(--text-color-active);

			transition:
				border-color var(--enter-active),
				background-color var(--enter-active);
		}
	}

	&.success {
		background-color: var(--success-color);
		color: white;

		&:hover,
		&:focus-visible {
			background-color: var(--success-color-hover);
			border-color: var(--success-color-hover);
			transition:
				border-color var(--enter-hover),
				background-color var(--enter-hover);
		}

		&:active {
			border-color: var(--success-color-active);
			background-color: var(--success-color-active);
			color: var(--text-color-active);

			transition:
				border-color var(--enter-active),
				background-color var(--enter-active);
		}
	}

	&.danger {
		background-color: var(--error-color);
		color: white;

		&:hover,
		&:focus-visible {
			background-color: var(--error-color-hover);
			border-color: var(--error-color-hover);
			transition:
				border-color var(--enter-hover),
				background-color var(--enter-hover);
		}

		&:active {
			border-color: var(--error-color-active);
			background-color: var(--error-color-active);
			color: var(--text-color-active);

			transition:
				border-color var(--enter-active),
				background-color var(--enter-active);
		}
	}

	&.no-print {
		@media print {
			display: none;
		}
	}
}
</style>
