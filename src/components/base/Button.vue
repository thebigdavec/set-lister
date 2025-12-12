<script setup lang="ts">
import { computed } from "vue";

const { size, nowrap, tooltip } = defineProps({
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
});

const buttonClasses = computed(() => ({
    [size]: true,
    nowrap: nowrap,
}));
</script>

<template>
    <Tooltip v-if="tooltip" :text="tooltip">
        <button
            aria-label="Button"
            :aria-details="tooltip ? tooltip : 'Click me'"
        >
            <slot />
        </button>
    </Tooltip>
    <button :class="buttonClasses">
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
    border: 1px solid oklch(from var(--card-bg) calc(l * 1.5) c h);
    /*padding: 0.6em 1.2em;*/
    transition: border-color 0.25s background-color 1s;
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
        border-color: var(--accent-color);
    }

    &:disabled {
        color: #666;
        cursor: not-allowed;
    }

    &.primary {
        background-color: var(--accent-color);
        color: white;

        &:hover {
            background-color: oklch(from var(--accent-color) calc(l * 0.8) c h);
            border-color: oklch(from var(--accent-color) calc(l * 0.8) c h);
        }
    }

    &.danger {
        background-color: var(--error-color);
        color: white;

        &:hover {
            background-color: oklch(from var(--error-color) calc(l * 0.8) c h);
            border-color: oklch(from var(--error-color) calc(l * 0.8) c h);
        }
    }
}
</style>
