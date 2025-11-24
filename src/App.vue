<script setup>
import { ref, nextTick, computed, onMounted, onUnmounted } from 'vue';
import { store, addSet, removeSet, updateMetadata, resetStore, loadStore, markClean } from './store';
import Set from './components/Set.vue';
import SetPreview from './components/SetPreview.vue';
import MenuBar from './components/MenuBar.vue';
import { autoScaleText } from './utils/autoScale';

const showPreview = ref(false);
const previewRef = ref(null);
const fileInput = ref(null);
const currentFileHandle = ref(null);

const previewSets = computed(() => store.sets.filter(set => set.songs && set.songs.length > 0));

async function togglePreview() {
  showPreview.value = true;
  await nextTick();
  
  if (previewRef.value) {
    // A4 dimensions in px (96 DPI)
    // Width: 210mm = 794px
    // Height: 297mm = 1123px
    // Padding: 2rem approx 32px per side -> 64px total. 
    // Let's use 120px safety margin to be sure and avoid clipping.
    const targetHeight = 1123 - 120; 
    const targetWidth = 794 - 120;
    
    // Get all set elements in the preview
    const sets = previewRef.value.querySelectorAll('.preview-set');
    
    // A4 Dimensions in pixels (96 DPI)
    // Width: 210mm ~= 794px
    // Height: 297mm ~= 1123px
    // We use these fixed dimensions for calculation to ensure consistency with print
    const a4Width = 794;
    const a4Height = 1123;
    
    // Subtract padding (approx 2rem = 32px on each side)
    const contentWidth = a4Width - 64;
    const contentHeight = a4Height - 64;
    
    sets.forEach(setEl => {
      // Find the content element which we want to scale
      const contentEl = setEl.querySelector('.set-content');
      if (contentEl) {
        autoScaleText(contentEl, contentHeight, contentWidth);
      }
    });
  }
}

function closePreview() {
  showPreview.value = false;
}

function printSets() {
  window.print();
}

const showNewDialog = ref(false);

function startNew() {
  if (!store.isDirty) {
    resetStore();
    currentFileHandle.value = null;
    return;
  }
  showNewDialog.value = true;
}

function confirmNew() {
  resetStore();
  currentFileHandle.value = null;
  showNewDialog.value = false;
}

function cancelNew() {
  showNewDialog.value = false;
}

async function saveToDisk(event) {
  const data = {
    metadata: store.metadata,
    sets: store.sets
  };
  const jsonString = JSON.stringify(data, null, 2);

  try {
    // Check if we can use the File System Access API
    if (window.showSaveFilePicker) {
      // Determine if we should "Save As" (Alt key or no current file)
      const saveAs = event?.altKey || !currentFileHandle.value;

      if (saveAs) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${store.metadata.setListName || 'set-list'}.json`,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        currentFileHandle.value = handle;
      }

      // Write to the file (either existing or new)
      const writable = await currentFileHandle.value.createWritable();
      await writable.write(jsonString);
      await writable.close();
      
      markClean();
    } else {
      // Fallback for browsers without API support
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${store.metadata.setListName || 'set-list'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      markClean();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to save file:', err);
      alert('Failed to save file.');
    }
  }
}

async function loadFromDisk() {
  if (store.isDirty) {
    if (!confirm("You have unsaved changes. Are you sure you want to load a new file? Unsaved changes will be lost.")) {
      return;
    }
  }

  try {
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
        multiple: false
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
      // Fallback
      fileInput.value.click();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Failed to load file:', err);
      alert('Failed to load file.');
    }
  }
}

function handleLegacyLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (loadStore(data)) {
        currentFileHandle.value = null; // Legacy load doesn't give us a handle
        event.target.value = ''; // Reset input
      } else {
        alert("Invalid set list file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reading file.");
    }
  };
  reader.readAsText(file);
}

function handleBeforeUnload(e) {
  if (store.isDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div v-if="!showPreview" class="app-container">
    <header class="no-print">
      <MenuBar 
        :is-dirty="store.isDirty"
        @new="startNew"
        @load="loadFromDisk"
        @save="saveToDisk"
        @save-as="saveToDisk({ altKey: true })"
        @add-set="addSet"
        @export="togglePreview"
      />
      <div class="header-top">
        <h1>Set Lister</h1>
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
      
      <div class="metadata-grid">
        <div class="input-group">
          <label>Set List Name</label>
          <input 
            v-model="store.metadata.setListName" 
            placeholder="e.g. Summer Tour 2024" 
            @blur="updateMetadata({ setListName: store.metadata.setListName })"
            @keyup.enter="$event.target.blur()"
          />
        </div>
        <div class="input-group">
          <label>Venue</label>
          <input 
            v-model="store.metadata.venue" 
            placeholder="e.g. The O2 Arena" 
            @blur="updateMetadata({ venue: store.metadata.venue })"
            @keyup.enter="$event.target.blur()"
          />
        </div>
        <div class="input-group">
          <label>Date</label>
          <input 
            v-model="store.metadata.date" 
            type="date" 
            @blur="updateMetadata({ date: store.metadata.date })"
            @keyup.enter="$event.target.blur()"
          />
        </div>
        <div class="input-group">
          <label>Act Name</label>
          <input 
            v-model="store.metadata.actName" 
            placeholder="e.g. The Beatles" 
            @blur="updateMetadata({ actName: store.metadata.actName })"
            @keyup.enter="$event.target.blur()"
          />
        </div>
      </div>
    </header>

    <main>
      <div class="sets-wrapper">
        <Set 
          v-for="set in store.sets" 
          :key="set.id" 
          :set="set"
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
      <button @click="printSets" class="primary">Print Now</button>
      <button @click="closePreview">Edit</button>
    </div>
    
    <div ref="previewRef" class="preview-content">
      <div class="sets-wrapper">
        <SetPreview 
          v-for="set in previewSets" 
          :key="set.id" 
          :set="set"
        />
      </div>
    </div>
  </div>
  <div v-if="showNewDialog" class="modal-overlay">
    <div class="modal">
      <h3>Start New Set List?</h3>
      <p>Are you sure you want to start a new set list? All current changes will be lost if not saved.</p>
      <div class="modal-actions">
        <button @click="cancelNew">Cancel</button>
        <button @click="confirmNew" class="danger">Start New</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... existing styles ... */
header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #333;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 1rem;
  background: #333;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.preview-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto; /* Enable scrolling */
  background-color: #525659; /* Dark gray background like PDF viewers */
  display: flex;
  flex-direction: column;
  align-items: center; /* Center pages */
  gap: 2rem;
}

.preview-content .sets-wrapper {
  display: block; /* Allow normal flow for page breaks */
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
