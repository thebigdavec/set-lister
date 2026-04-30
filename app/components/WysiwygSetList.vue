<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, watch } from "vue";
import { useSetlistStore } from "../stores/store";
import WysiwygSet from "./WysiwygSet.vue";
import { useSetlistNavigation } from "../composables";

defineProps<{
	showSongNumbers?: boolean;
}>();

const store = useSetlistStore();

// Navigation state
const navigationEnabled = ref(true);
const navigation = useSetlistNavigation({ enabled: navigationEnabled });

// Provide navigation context to child components
provide("setlistNavigation", navigation);

const carouselRef = ref<any>(null);
const activeIndex = ref(0);
let observer: IntersectionObserver | null = null;

// Global keyboard handler for navigation
function handleGlobalKeyDown(event: KeyboardEvent): void {
	navigation.handleKeyDown(event);
}

onMounted(() => {
	window.addEventListener("keydown", handleGlobalKeyDown);

	const setupObserver = () => {
		if (observer) observer.disconnect();

		const rootElement = carouselRef.value?.$el || carouselRef.value;
		if (!rootElement) return;

		observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
					activeIndex.value = index;
				}
			});
		}, {
			root: rootElement,
			rootMargin: "0px -40% 0px -40%", // Trigger when item is in the active middle 20%
			threshold: 0
		});

		const children = rootElement.querySelectorAll('.wysiwyg-set');
		children.forEach((child: Element) => observer?.observe(child));
	}

	watch(
		() => store.state.sets,
		() => {
			setTimeout(setupObserver, 200);
		},
		{ immediate: true, deep: true }
	);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleGlobalKeyDown);
	observer?.disconnect();
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
	<Card ref="carouselRef" class="sets-wrapper wysiwyg-carousel">
		<WysiwygSet v-for="(set, setIndex) in store.state.sets" :key="set.id" :set="set" :set-index="setIndex"
			:is-last="set.id === store.lastSetId" :show-song-numbers="showSongNumbers" :is-active="activeIndex === setIndex"
			:data-index="setIndex" class="wysiwyg-set" @remove-set="store.removeSet(set.id)" />
	</Card>
</template>

<style scoped>
.sets-wrapper {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	align-items: start;
}

.wysiwyg-carousel {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	overflow-x: auto;
	scroll-snap-type: x mandatory;
	align-items: center;
	padding: 2rem calc(50vw - 150px);
	gap: 3rem;
	min-height: 80vh;
	/* Hide scrollbar for cleaner look */
	scrollbar-width: none;
	-ms-overflow-style: none;
}

.wysiwyg-carousel::-webkit-scrollbar {
	display: none;
}

/* Make children snap and transition nicely */
.wysiwyg-carousel>* {
	scroll-snap-align: center;
	transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
	flex: 0 0 auto;
}
</style>
