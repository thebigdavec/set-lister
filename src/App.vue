<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
    addSet,
    loadStore,
    markClean,
    removeSet,
    resetStore,
    store,
    updateMetadata,
} from "./store";
import Set from "./components/Set.vue";
import SetPreview from "./components/SetPreview.vue";
import MenuBar from "./components/MenuBar.vue";
import { fitStringsToBox } from "./utils/fitStringsToBox";
import { formatSongLabel } from "./utils/textMetrics";

const showPreview = ref(false);
const previewRef = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const currentFileHandle = ref<FileSystemFileHandle | null>(null);
const uppercasePreview = ref(false);
const previewScale = ref(1);

const previewSets = computed(() =>
    store.sets.filter((set) => set.songs.length > 0),
);
const lastSetId = computed(() =>
    store.sets.length ? store.sets[store.sets.length - 1].id : null,
);

const CM_TO_PX = 37.795275591; // 1 cm ≈ 37.795 px
const TARGET_HEIGHT_CM = 29.7;
const TARGET_WIDTH_CM = 21.0;
const MARGINS_CM = {
    top: 1,
    bottom: 1,
    left: 1,
    right: 1,
};

const BOX_HEIGHT_CM = TARGET_HEIGHT_CM - MARGINS_CM.top - MARGINS_CM.bottom;
const BOX_WIDTH_CM = TARGET_WIDTH_CM - MARGINS_CM.left - MARGINS_CM.right;
const TARGET_WIDTH_PX = TARGET_WIDTH_CM * CM_TO_PX;
const TARGET_HEIGHT_PX = TARGET_HEIGHT_CM * CM_TO_PX;
const PREVIEW_UPPERCASE_KEY = "set-lister-preview-uppercase";

const previewSheetStyle = computed(() => ({
    width: `${TARGET_WIDTH_PX}px`,
    minHeight: `${TARGET_HEIGHT_PX}px`,
}));

const previewWrapperStyle = computed(() => ({
    transform: `scale(${previewScale.value})`,
    transformOrigin: "top center",
    height: `${TARGET_HEIGHT_PX * previewScale.value}px`,
}));

function updatePreviewScale(): void {
    if (!showPreview.value || !previewRef.value) {
        previewScale.value = 1;
        return;
    }

    const container = previewRef.value;
    const styles = window.getComputedStyle(container);
    const paddingLeft = parseFloat(styles.paddingLeft || "0");
    const paddingRight = parseFloat(styles.paddingRight || "0");
    const availableWidth = container.clientWidth - paddingLeft - paddingRight;

    if (availableWidth <= 0) {
        previewScale.value = 1;
        return;
    }

    const scale = Math.min(1, availableWidth / TARGET_WIDTH_PX);
    previewScale.value = Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function handlePreviewResize(): void {
    if (!showPreview.value) return;
    updatePreviewScale();
}

async function applyPreviewSizing(): Promise<void> {
    if (!showPreview.value) return;
    await nextTick();
    if (!previewRef.value) return;

    for (const set of previewSets.value) {
        const selector = `.preview-set[data-set-id="${set.id}"] .song-list`;
        const songsEl = previewRef.value.querySelector<HTMLElement>(selector);
        if (!songsEl) continue;

        const strings = set.songs.map((song) => {
            const title = uppercasePreview.value
                ? song.title.toUpperCase()
                : song.title;
            return formatSongLabel(title, song.key);
        });

        if (strings.length === 0) {
            songsEl.style.fontSize = "";
            songsEl.style.lineHeight = "";
            songsEl.style.width = `${TARGET_WIDTH_PX}px`;
            songsEl.style.transform = "";
            songsEl.style.transformOrigin = "";
            continue;
        }

        const { fontSizePx, lineHeight } = fitStringsToBox(
            strings,
            BOX_WIDTH_CM,
            BOX_HEIGHT_CM,
        );
        songsEl.style.fontSize = `${fontSizePx}px`;
        songsEl.style.lineHeight = lineHeight.toString();
        songsEl.style.width = `${TARGET_WIDTH_PX}px`;
        songsEl.style.transform = "";
        songsEl.style.transformOrigin = "";
    }
}

async function togglePreview(): Promise<void> {
    showPreview.value = true;
    await applyPreviewSizing();
    updatePreviewScale();
}

function closePreview(): void {
    showPreview.value = false;
}

function printSets(): void {
    window.print();
}

const showNewDialog = ref(false);

function startNew(): void {
    if (!store.isDirty) {
        resetStore();
        currentFileHandle.value = null;
        return;
    }
    showNewDialog.value = true;
}

function confirmNew(): void {
    resetStore();
    currentFileHandle.value = null;
    showNewDialog.value = false;
}

function cancelNew(): void {
    showNewDialog.value = false;
}

function blurInputOnEnter(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement | null;
    target?.blur();
}

type SaveEvent = MouseEvent | KeyboardEvent | { altKey?: boolean } | undefined;

async function saveToDisk(event?: SaveEvent): Promise<void> {
    const data = {
        metadata: store.metadata,
        sets: store.sets,
    };
    const jsonString = JSON.stringify(data, null, 2);

    try {
        if (
            "showSaveFilePicker" in window &&
            typeof window.showSaveFilePicker === "function"
        ) {
            const saveAs =
                Boolean(event && "altKey" in event && event.altKey) ||
                !currentFileHandle.value;

            if (saveAs) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${store.metadata.setListName || "set-list"}.json`,
                    types: [
                        {
                            description: "JSON Files",
                            accept: { "application/json": [".json"] },
                        },
                    ],
                });
                currentFileHandle.value = handle;
            }

            if (!currentFileHandle.value) return;

            const writable = await currentFileHandle.value.createWritable();
            await writable.write(jsonString);
            await writable.close();

            markClean();
        } else {
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${store.metadata.setListName || "set-list"}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            markClean();
        }
    } catch (err) {
        const error = err as DOMException;
        if (error.name !== "AbortError") {
            console.error("Failed to save file:", err);
            alert("Failed to save file.");
        }
    }
}

async function loadFromDisk(): Promise<void> {
    if (store.isDirty) {
        const confirmed = confirm(
            "You have unsaved changes. Are you sure you want to load a new file? Unsaved changes will be lost.",
        );
        if (!confirmed) return;
    }

    try {
        if (
            "showOpenFilePicker" in window &&
            typeof window.showOpenFilePicker === "function"
        ) {
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: "JSON Files",
                        accept: { "application/json": [".json"] },
                    },
                ],
                multiple: false,
            });

            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);

            if (loadStore(data)) {
                currentFileHandle.value = handle;
            } else {
                alert("Invalid set list file.");
            }
        } else {
            fileInput.value?.click();
        }
    } catch (err) {
        const error = err as DOMException;
        if (error.name !== "AbortError") {
            console.error("Failed to load file:", err);
            alert("Failed to load file.");
        }
    }
}

function handleLegacyLoad(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
            const text =
                typeof e.target?.result === "string" ? e.target.result : "";
            const data = JSON.parse(text);
            if (loadStore(data)) {
                currentFileHandle.value = null;
                if (input) {
                    input.value = "";
                }
            } else {
                alert("Invalid set list file.");
            }
        } catch (error) {
            console.error(error);
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
}

function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (store.isDirty) {
        event.preventDefault();
        event.returnValue = "";
    }
}

onMounted(() => {
    const savedUppercase = localStorage.getItem(PREVIEW_UPPERCASE_KEY);
    uppercasePreview.value = savedUppercase === "true";
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("resize", handlePreviewResize);
});

onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("resize", handlePreviewResize);
});

watch(uppercasePreview, async (value) => {
    localStorage.setItem(PREVIEW_UPPERCASE_KEY, String(value));
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
            <div class="header-top">
                <div class="controls">
                    <input
                        type="file"
                        ref="fileInput"
                        @change="handleLegacyLoad"
                        accept=".json"
                        style="display: none"
                    />
                </div>
            </div>
            <div class="header-metadata">
                <div class="metadata-grid">
                    <div class="input-group">
                        <label>Set List Name</label>
                        <input
                            v-model="store.metadata.setListName"
                            placeholder="e.g. Summer Tour 2024"
                            @blur="
                                updateMetadata({
                                    setListName: store.metadata.setListName,
                                })
                            "
                            @keyup.enter="blurInputOnEnter"
                        />
                    </div>

                    <div class="input-group">
                        <label>Venue</label>
                        <input
                            v-model="store.metadata.venue"
                            placeholder="e.g. The O2 Arena"
                            @blur="
                                updateMetadata({ venue: store.metadata.venue })
                            "
                            @keyup.enter="blurInputOnEnter"
                        />
                    </div>

                    <div class="input-group">
                        <label>Date</label>
                        <input
                            v-model="store.metadata.date"
                            type="date"
                            @blur="
                                updateMetadata({ date: store.metadata.date })
                            "
                            @keyup.enter="blurInputOnEnter"
                        />
                    </div>

                    <div class="input-group">
                        <label>Act Name</label>
                        <input
                            v-model="store.metadata.actName"
                            placeholder="e.g. The Beatles"
                            @blur="
                                updateMetadata({
                                    actName: store.metadata.actName,
                                })
                            "
                            @keyup.enter="blurInputOnEnter"
                        />
                    </div>
                </div>
            </div>
        </header>

        <main>
            <div class="sets-wrapper">
                <Set
                    v-for="set in store.sets"
                    :key="set.id"
                    :set="set"
                    :is-last="set.id === lastSetId"
                    @remove-set="removeSet(set.id)"
                />
            </div>
        </main>

        <footer class="no-print">
            <p>Drag and drop songs to reorder. Click 'Print' to save as PDF.</p>
        </footer>
    </div>

    <div v-else class="print-preview">
        <div class="preview-controls no-print">
            <div class="preview-actions">
                <button @click="printSets" class="preview-btn primary">
                    Print Now
                </button>
                <button @click="closePreview" class="preview-btn">
                    Close Preview
                </button>
            </div>
            <label class="uppercase-toggle">
                <input type="checkbox" v-model="uppercasePreview" />
                Uppercase titles
            </label>
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

.header-metadata {
    background-color: #222;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #444;
}

.metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.input-group label {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.input-group input {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #444;
    background: #222;
    color: white;
}

.input-group input:focus {
    border-color: var(--accent-color);
    outline: none;
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

.sets-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    align-items: start;
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
    background: white;
    color: black;
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.preview-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    background: #222;
    border: 1px solid #444;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin: 1rem;
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

.uppercase-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #eee;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.uppercase-toggle input {
    accent-color: var(--accent-color);
}

.preview-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    /* Enable scrolling */
    background-color: #525659;
    /* Dark gray background like PDF viewers */
    display: flex;
    flex-direction: column;
    align-items: center;
    /* Center pages */
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
}

.preview-page :deep(.preview-set) {
    width: 210mm;
    min-height: 297mm;
}

.preview-content .sets-wrapper {
    display: block;
    /* Allow normal flow for page breaks */
}

/* Hide delete buttons in preview */

@media print {
    .print-preview {
        position: static;
        height: auto;
        width: auto;
        overflow: visible;
    }

    .preview-controls {
        display: none;
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
