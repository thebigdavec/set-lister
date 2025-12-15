<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, watch } from "vue";
import { lastSetId, removeSet, store } from "../store";
import Set from "./Set.vue";
import { useSetlistNavigation } from "../composables";

defineProps<{
	showSongNumbers?: boolean;
}>();

// Navigation state
const navigationEnabled = ref(true);
const navigation = useSetlistNavigation({ enabled: navigationEnabled });

// Provide navigation context to child components
provide("setlistNavigation", navigation);

// Global keyboard handler for navigation
function handleGlobalKeyDown(event: KeyboardEvent): void {
	navigation.handleKeyDown(event);
}

onMounted(() => {
	window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleGlobalKeyDown);
});

// Watch for edit requests and handle them (components will listen via provide/inject)
watch(
	() => navigation.editRequested.value,
	(request) => {
		if (request) {
			// The edit request is handled by the individual components
			// via the provided navigation context
		}
	},
);
</script>

<template>
	<Card class="sets-wrapper">
		<Set
			v-for="(set, setIndex) in store.sets"
			:key="set.id"
			:set="set"
			:set-index="setIndex"
			:is-last="set.id === lastSetId"
			:show-song-numbers="showSongNumbers"
			@remove-set="removeSet(set.id)"
		/>
	</Card>
</template>

<style scoped>
.sets-wrapper {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	align-items: start;
}
</style>
