<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { Printer, X } from "lucide-vue-next";
import { addSet, isDirty, lastSetId, resetStore, store } from "./store";
import SetList from "./components/SetList.vue";
import SetlistMetadata from "./components/SetlistMetadata.vue";
import SetPreview from "./components/SetPreview.vue";
import MenuBar from "./components/MenuBar.vue";
import { STORAGE_KEYS } from "./constants";
import { safeGetItem, safeSetItem } from "./utils/storage";
import {
	useFileOperations,
	useHistory,
	useKeyboardShortcuts,
	usePreviewScaling,
	useDialogs,
	createEditShortcuts,
	createPreviewShortcuts,
} from "./composables";

// =============================================================================
// Refs and State
// =============================================================================

const showPreview = ref(false);
const previewRef = ref<HTMLDivElement | null>(null);
const uppercasePreview = ref(false);
const showGuides = ref(false);
const previewScale = ref(1);
const showNewDialog = ref(false);
const showEditorNumbers = ref(false);
const showPreviewNumbers = ref(false);

// =============================================================================
// Computed Properties
// =============================================================================

const previewSets = computed(() =>
	store.sets.filter((set) => set.songs.length > 0),
);

// =============================================================================
// Composables
// =============================================================================

// Dialog management for confirmations and alerts
const {
	confirmDialog,
	alertDialog,
	showConfirm,
	showAlert,
	handleConfirm: handleDialogConfirm,
	handleCancel: handleDialogCancel,
	handleAlertOk,
} = useDialogs();

// History management (undo/redo)
const { undo, redo, canUndo, canRedo, clearHistory } = useHistory();

// File operations (save, load, beforeunload)
const { saveToDisk, loadFromDisk, clearFileHandle, handleBeforeUnload } =
	useFileOperations({ showConfirm, showAlert, onLoad: clearHistory });

// Preview scaling and sizing
const {
	previewSheetStyle,
	previewWrapperStyle,
	updatePreviewScale,
	handlePreviewResize,
	applyPreviewSizing,
	printSets,
} = usePreviewScaling(previewScale, {
	previewRef,
	showPreview,
	uppercasePreview,
	showNumbers: showPreviewNumbers,
	previewSets,
});

// =============================================================================
// Dialog and Preview Functions
// =============================================================================

function startNew(): void {
	if (!isDirty.value) {
		resetStore();
		clearFileHandle();
		return;
	}
	showNewDialog.value = true;
}

function confirmNew(): void {
	resetStore();
	clearFileHandle();
	clearHistory();
	showNewDialog.value = false;
}

function cancelNew(): void {
	showNewDialog.value = false;
}

async function togglePreview(): Promise<void> {
	showPreview.value = true;
	await applyPreviewSizing();
	updatePreviewScale();
}

function closePreview(): void {
	showPreview.value = false;
}

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

useKeyboardShortcuts({
	shortcuts: createEditShortcuts({
		newDocument: startNew,
		save: () => saveToDisk(),
		saveAs: () => saveToDisk({ altKey: true }),
		open: loadFromDisk,
		togglePreview,
		addSet,
		undo,
		redo,
	}),
	previewShortcuts: createPreviewShortcuts({
		closePreview,
		print: printSets,
	}),
	isPreviewMode: showPreview,
});

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
	const savedUppercase = safeGetItem(STORAGE_KEYS.PREVIEW_UPPERCASE);
	uppercasePreview.value = savedUppercase === "true";
	const savedEditorNumbers = safeGetItem(STORAGE_KEYS.EDITOR_NUMBERING);
	showEditorNumbers.value = savedEditorNumbers === "true";
	const savedPreviewNumbers = safeGetItem(STORAGE_KEYS.PREVIEW_NUMBERING);
	showPreviewNumbers.value = savedPreviewNumbers === "true";
	window.addEventListener("beforeunload", handleBeforeUnload);
	window.addEventListener("resize", handlePreviewResize);
});

onUnmounted(() => {
	window.removeEventListener("beforeunload", handleBeforeUnload);
	window.removeEventListener("resize", handlePreviewResize);
});

watch(uppercasePreview, async (value) => {
	safeSetItem(STORAGE_KEYS.PREVIEW_UPPERCASE, String(value));
	if (showPreview.value) {
		await applyPreviewSizing();
		updatePreviewScale();
	}
});

watch(showEditorNumbers, (value) => {
	safeSetItem(STORAGE_KEYS.EDITOR_NUMBERING, String(value));
});

watch(showPreviewNumbers, async (value) => {
	safeSetItem(STORAGE_KEYS.PREVIEW_NUMBERING, String(value));
	if (showPreview.value) {
		await applyPreviewSizing();
	}
});

watch(showPreview, async (value) => {
	if (value) {
		await nextTick();
		updatePreviewScale();
	} else {
		previewScale.value = 1;
	}
});
</script>

<template>
	<div v-if="!showPreview" class="app-container">
		<header class="no-print">
			<h1>
				<img src="/red-worf.png" alt="Red Worf, the App icon" />Dave's
				Lister
			</h1>
			<p class="header-strap">
				A simple set list creator for solo performers and bands.
			</p>

			<MenuBar
				:is-dirty="isDirty"
				:can-undo="canUndo"
				:can-redo="canRedo"
				@new="startNew"
				@load="loadFromDisk"
				@save="saveToDisk"
				@save-as="saveToDisk({ altKey: true })"
				@undo="undo"
				@redo="redo"
			/>

			<SetlistMetadata
				:has-sets="previewSets.length > 0"
				v-model:show-song-numbers="showEditorNumbers"
				@add-set="addSet"
				@export="togglePreview"
			/>
		</header>

		<SetList :show-song-numbers="showEditorNumbers" />
	</div>

	<div v-else class="print-preview">
		<div class="preview-controls no-print">
			<label class="preview-control">
				<input type="checkbox" v-model="showGuides" />
				Show guides
			</label>
			<label class="preview-control">
				<input type="checkbox" v-model="uppercasePreview" />
				Uppercase titles
			</label>
			<label class="preview-control">
				<input type="checkbox" v-model="showPreviewNumbers" />
				Song numbers
			</label>
			<Button
				@click="printSets"
				class="primary"
				tooltip="Print the setlist"
				aria-label="Print setlist"
			>
				<Printer class="icon" /> Print
			</Button>
			<Button
				@click="closePreview"
				class="danger"
				tooltip="Close preview and return to editor"
				aria-label="Close preview"
			>
				<X class="icon" /> Close
			</Button>
		</div>

		<div ref="previewRef" class="preview-content">
			<div class="sets-wrapper">
				<div
					v-for="(set, index) in previewSets"
					:key="set.id"
					class="preview-page"
					:style="previewWrapperStyle"
				>
					<SetPreview
						:set="set"
						:set-index="index"
						:metadata="store.metadata"
						:uppercase="uppercasePreview"
						:show-guides="showGuides"
						:show-numbers="showPreviewNumbers"
						:is-last="set.id === lastSetId"
						:style="previewSheetStyle"
					/>
				</div>
			</div>
		</div>
	</div>
	<!-- New Set List Confirmation Dialog -->
	<ConfirmDialog
		:show="showNewDialog"
		title="Start New Set List?"
		message="Are you sure you want to start a new set list? All current changes will be lost if not saved."
		cancel-text="Cancel"
		confirm-text="Start New"
		:danger="true"
		@confirm="confirmNew"
		@cancel="cancelNew"
	/>

	<!-- Generic Confirmation Dialog (for file operations) -->
	<ConfirmDialog
		:show="confirmDialog.show"
		:title="confirmDialog.title"
		:message="confirmDialog.message"
		:cancel-text="confirmDialog.cancelText"
		:confirm-text="confirmDialog.confirmText"
		:danger="confirmDialog.danger"
		@confirm="handleDialogConfirm"
		@cancel="handleDialogCancel"
	/>

	<!-- Alert Dialog (for errors and notifications) -->
	<ConfirmDialog
		:show="alertDialog.show"
		:title="alertDialog.title"
		:message="alertDialog.message"
		:alert-mode="true"
		:ok-text="alertDialog.okText"
		@ok="handleAlertOk"
	/>
</template>

<style scoped>
header {
	margin-block-end: 1.5rem;

	.header-strap {
		margin: 0;
		line-height: 1;
		margin-block-end: 1em;
		color: #fffa;
	}
}

h1 {
	margin: 0;
	background: linear-gradient(45deg, #646cff, #a164ff);
	background-clip: text;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;

	img {
		width: 1em;
		height: auto;
		vertical-align: middle;
		margin-right: 0.5rem;
	}
}

.controls {
	display: flex;
	gap: 1rem;
}

footer {
	margin-top: 3rem;
	text-align: center;
	color: #666;
	font-size: 0.9rem;
}

/* Preview Styles */
.print-preview {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	z-index: 1000;
	display: flex;
	flex-direction: column;
}

.preview-controls {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	gap: 1rem;
	border: 1px solid #444;
	padding: 0.5rem 1rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}

.preview-control {
	display: flex;
	gap: 0.5rem;
	border: 1px solid #666;
	cursor: pointer;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	transition: background-color 0.2s ease;
}

.preview-content {
	flex: 1;
	padding: 1rem;
	overflow-y: auto;
	background-color: var(--bg-color-muted);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;
	width: 100%;
	box-sizing: border-box;
}

@media (min-width: 900px) {
	.preview-content {
		padding: 2rem;
		gap: 2rem;
	}
}

.preview-page {
	transition: transform 0.2s ease;
	display: flex;
	justify-content: center;
	flex-shrink: 0;
	margin-block-end: 1rem;

	@media print {
		margin: 0;
	}
}

.preview-page :deep(.preview-set) {
	width: 210mm;
	min-height: 297mm;
}

.preview-content .sets-wrapper {
	display: block;
}

@media print {
	.print-preview {
		position: static;
		height: auto;
		width: auto;
		overflow: visible;
		background: none;
	}

	.preview-controls {
		display: none;
	}

	.preview-content {
		flex: none;
		padding: 0;
		gap: 0;
		background: none;
		display: block;
		overflow: visible;
		height: auto;
		width: auto;
	}

	.sets-wrapper {
		display: block;
	}

	.preview-page {
		transform: none !important;
		height: auto !important;
		display: block;
	}

	.app-container {
		display: none;
	}
}
</style>
