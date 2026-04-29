<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
	FilePlus,
	FolderOpen,
	Menu,
	Redo2,
	Save,
	SaveAll,
	Undo2,
	X,
} from "lucide-vue-next";
import { shortcuts } from "../utils/keyboardShortcuts";

withDefaults(
	defineProps<{
		isDirty?: boolean;
		canUndo?: boolean;
		canRedo?: boolean;
	}>(),
	{
		isDirty: false,
		canUndo: false,
		canRedo: false,
	},
);

type MenuAction = "new" | "load" | "save" | "save-as" | "undo" | "redo";

const emit = defineEmits<{
	(e: MenuAction): void;
}>();

const isMobileMenuOpen = ref(false);

function handleAction(action: MenuAction): void {
	// Centralized emit so every button automatically closes transient UI if needed later
	emit(action);
	// Close mobile menu after action
	isMobileMenuOpen.value = false;
}

function toggleMobileMenu(): void {
	isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu(): void {
	isMobileMenuOpen.value = false;
}

function handleKeyDown(event: KeyboardEvent): void {
	if (event.key === "Escape" && isMobileMenuOpen.value) {
		closeMobileMenu();
	}
}

onMounted(() => {
	// Always listen for Escape key to close menu when open
	// This is lightweight and ensures menu can be closed from anywhere
	window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
	<div class="menu-container no-print">
		<!-- Undo/Redo buttons - always visible -->
		<div class="undo-redo-buttons">
			<Button
				@click="handleAction('undo')"
				nowrap
				:disabled="!canUndo"
				:tooltip="`Undo (${shortcuts.undo})`"
				aria-label="Undo"
				aria-describedby="tooltip-undo"
			>
				<Undo2 class="icon" /> <span class="button-label">Undo</span>
			</Button>
			<Button
				@click="handleAction('redo')"
				nowrap
				:disabled="!canRedo"
				aria-describedby="tooltip-redo"
				:tooltip="`Redo (${shortcuts.redo})`"
				aria-label="Redo"
			>
				<Redo2 class="icon" /> <span class="button-label">Redo</span>
			</Button>
		</div>

		<!-- Burger menu button (mobile only) -->
		<Button
			class="burger-menu-button"
			:class="{ 'mobile-open': isMobileMenuOpen }"
			@click="toggleMobileMenu"
			aria-label="Toggle menu"
			:aria-expanded="isMobileMenuOpen"
		>
			<Menu v-if="!isMobileMenuOpen" class="icon" />
			<X v-else class="icon" />
		</Button>

		<!-- Mobile menu overlay -->
		<div
			v-if="isMobileMenuOpen"
			class="mobile-menu-overlay"
			@click="closeMobileMenu"
			aria-hidden="true"
		></div>

		<!-- Menu content (desktop always visible, mobile slide-in) -->
		<div class="menu-bar" :class="{ 'mobile-open': isMobileMenuOpen }">
			<div class="menu-items">
				<Button
					@click="handleAction('new')"
					nowrap
					:tooltip="`New Set List (${shortcuts.newDocument})`"
					aria-describedby="tooltip-new"
				>
					<FilePlus class="icon" /> New Set List
				</Button>
				<Button
					@click="handleAction('load')"
					nowrap
					:tooltip="`Open Set List (${shortcuts.open})`"
					aria-describedby="tooltip-load"
				>
					<FolderOpen class="icon" /> Open Set List
				</Button>
			</div>
			<div class="menu-items">
				<Button
					@click="handleAction('save')"
					nowrap
					:disabled="!isDirty"
					:class="{ 'dirty-indicator-text': isDirty }"
					:tooltip="`Save Set List (${shortcuts.save})`"
					aria-describedby="tooltip-save"
				>
					<Save class="icon" /> Save Set List
					<span v-if="isDirty" class="dirty-indicator">*</span>
				</Button>
				<Button
					@click="handleAction('save-as')"
					nowrap
					:tooltip="`Save Set List As (${shortcuts.saveAs})`"
					aria-describedby="tooltip-save-as"
				>
					<SaveAll class="icon" /> Save A Copy
				</Button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.menu-container {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
	position: relative;
}

/* Undo/Redo buttons - always visible */
.undo-redo-buttons {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	z-index: 100;
}

/* Burger menu button - hidden on desktop */
.burger-menu-button {
	display: none;
	background-color: #333;
	border: none;
	color: #ddd;
	padding: 0.6rem;
	cursor: pointer;
	border-radius: 6px;
	box-shadow: 0 2px 4px -2px #000;
	transition: background-color 0.2s;
	z-index: 1001;

	&.mobile-open {
		background-color: #400;
	}
}

/* Mobile menu overlay */
.mobile-menu-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.5);
	z-index: 999;
}

.menu-bar {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	position: relative;
	z-index: 100;
	align-items: center;
	text-wrap: nowrap;
}

.menu-items {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}

.dirty-indicator-text {
	outline: 2px solid #ee88;
}

.dirty-indicator {
	color: #ee8;
}

/* Mobile responsive styles */
@media (max-width: 767px) {
	.menu-container {
		justify-content: flex-start;
	}

	/* Undo/Redo buttons - icon only on mobile */
	.undo-redo-buttons {
		order: 1;
	}

	.undo-redo-buttons .button-label {
		display: none;
	}

	/* Show burger button on mobile */
	.burger-menu-button {
		display: flex;
		align-items: center;
		justify-content: center;
		order: 2;
		margin-left: auto;
	}

	/* Menu bar becomes a slide-in panel on mobile */
	.menu-bar {
		position: fixed;
		top: 0;
		right: -100%;
		width: 280px;
		height: 100vh;
		background: #1a1a1a;
		border-left: 1px solid #444;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
		padding: 1rem;
		padding-top: 4rem;
		margin: 0;
		gap: 1rem;
		z-index: 1000;
		transition: right 0.3s ease-in-out;
		overflow-y: auto;
	}

	/* When mobile menu is open, slide in from right */
	.menu-bar.mobile-open {
		right: 0;
	}

	/* Stack menu items vertically on mobile */
	.menu-bar .menu-items {
		width: 100%;
		flex-direction: column;
	}

	.menu-bar .action-item {
		width: 100%;
		justify-content: flex-start;
	}
}
</style>
