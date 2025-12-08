<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { addSet, resetStore, store } from "./store";
import SetList from "./components/SetList.vue";
import SetlistMetadata from "./components/SetlistMetadata.vue";
import SetPreview from "./components/SetPreview.vue";
import MenuBar from "./components/MenuBar.vue";
import { STORAGE_KEYS } from "./constants";
import {
    useFileOperations,
    useKeyboardShortcuts,
    usePreviewScaling,
    createEditBindings,
    createPreviewBindings,
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

// =============================================================================
// Computed Properties
// =============================================================================

const previewSets = computed(() =>
    store.sets.filter((set) => set.songs.length > 0),
);
const lastSetId = computed(() =>
    store.sets.length ? store.sets[store.sets.length - 1].id : null,
);

// =============================================================================
// Composables
// =============================================================================

// File operations (save, load, beforeunload)
const {
    fileInput,
    saveToDisk,
    loadFromDisk,
    clearFileHandle,
    handleBeforeUnload,
} = useFileOperations();

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
    previewSets,
});

// =============================================================================
// Dialog and Preview Functions
// =============================================================================

function startNew(): void {
    if (!store.isDirty) {
        resetStore();
        clearFileHandle();
        return;
    }
    showNewDialog.value = true;
}

function confirmNew(): void {
    resetStore();
    clearFileHandle();
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

useKeyboardShortcuts(showPreview, {
    editBindings: createEditBindings({
        startNew,
        saveToDisk,
        loadFromDisk,
        togglePreview,
        addSet,
    }),
    previewBindings: createPreviewBindings({
        closePreview,
    }),
});

// =============================================================================
// Lifecycle
// =============================================================================

onMounted(() => {
    const savedUppercase = localStorage.getItem(STORAGE_KEYS.PREVIEW_UPPERCASE);
    uppercasePreview.value = savedUppercase === "true";
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("resize", handlePreviewResize);
});

onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("resize", handlePreviewResize);
});

watch(uppercasePreview, async (value) => {
    localStorage.setItem(STORAGE_KEYS.PREVIEW_UPPERCASE, String(value));
    if (showPreview.value) {
        await applyPreviewSizing();
        updatePreviewScale();
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
            <h1>Set Lister</h1>

            <MenuBar
                :has-sets="previewSets.length > 0"
                :is-dirty="store.isDirty"
                @new="startNew"
                @load="loadFromDisk"
                @save="saveToDisk"
                @save-as="saveToDisk({ altKey: true })"
                @add-set="addSet"
                @export="togglePreview"
            />

            <SetlistMetadata />
        </header>

        <SetList />
    </div>

    <div v-else class="print-preview">
        <div class="preview-controls no-print">
            <div class="preview-settings">
                <label class="uppercase-toggle">
                    <input type="checkbox" v-model="showGuides" />
                    Show guides
                </label>
                <label class="uppercase-toggle">
                    <input type="checkbox" v-model="uppercasePreview" />
                    Uppercase titles
                </label>
                <button @click="printSets" class="preview-btn primary">
                    Print
                </button>
                <button @click="closePreview" class="preview-btn danger">
                    X
                </button>
            </div>
        </div>

        <div ref="previewRef" class="preview-content">
            <div class="sets-wrapper">
                <div
                    v-for="set in previewSets"
                    :key="set.id"
                    class="preview-page"
                    :style="previewWrapperStyle"
                >
                    <SetPreview
                        :set="set"
                        :uppercase="uppercasePreview"
                        :show-guides="showGuides"
                        :is-last="set.id === lastSetId"
                        :style="previewSheetStyle"
                    />
                </div>
            </div>
        </div>
    </div>
    <div v-if="showNewDialog" class="modal-overlay">
        <div class="modal">
            <h3>Start New Set List?</h3>
            <p>
                Are you sure you want to start a new set list? All current
                changes will be lost if not saved.
            </p>
            <div class="modal-actions">
                <button @click="cancelNew">Cancel</button>
                <button @click="confirmNew" class="danger">Start New</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
header {
    margin-block-end: 1.5rem;
}

h1 {
    margin: 0;
    font-size: 2rem;
    background: linear-gradient(45deg, #646cff, #a164ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.controls {
    display: flex;
    gap: 1rem;
}

.primary {
    background-color: var(--accent-color);
    color: white;
}

.primary:hover {
    background-color: #535bf2;
    border-color: #535bf2;
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
    background: #222;
    border: 1px solid #444;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}

.preview-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.preview-btn {
    background: #333;
    border: none;
    color: #ddd;
    padding: 0.6rem 1rem;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    box-shadow: 0 2px 4px -2px #000;
    transition: background-color 0.1s ease;
}

.preview-btn:hover {
    background: #444;
    color: #fff;
}

.preview-btn.primary {
    background: var(--accent-color);
    color: white;
}

.preview-settings {
    display: flex;
    gap: 0.5rem;
    > * {
        background: #333;
        border: none;
        color: #ddd;
        padding: 0.6rem 1rem;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #eee;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        input {
            accent-color: var(--accent-color);
        }
    }
}

.preview-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    background-color: #525659;
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

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal {
    background: #333;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal h3 {
    margin-top: 0;
    color: white;
}

.modal p {
    color: #ccc;
    margin-bottom: 2rem;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.danger {
    background-color: #ff4444;
    color: white;
    border-color: #ff4444;
}

.danger:hover {
    background-color: #cc0000;
    border-color: #cc0000;
}
</style>
