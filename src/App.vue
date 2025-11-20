<script setup>
import { ref, nextTick, computed } from 'vue';
import { store, addSet, removeSet } from './store';
import Set from './components/Set.vue';
import SetPreview from './components/SetPreview.vue';
import { autoScaleText } from './utils/autoScale';

const showPreview = ref(false);
const previewRef = ref(null);

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
</script>

<template>
  <div v-if="!showPreview" class="app-container">
    <header class="no-print">
      <h1>Set Lister</h1>
      <div class="controls">
        <button @click="addSet">Add Set</button>
        <button @click="togglePreview" class="primary">Print / Export PDF</button>
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
</template>

<style scoped>
/* ... existing styles ... */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

h1 {
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(45deg, #646cff, #a164ff);
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
</style>
