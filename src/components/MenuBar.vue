<script setup lang="ts">
import { onMounted, onUnmounted, ref, withDefaults } from 'vue';
import {
  ChevronDown,
  FileDown,
  FilePlus,
  FolderOpen,
  PlusCircle,
  Save,
  SaveAll,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    hasSets?: boolean;
    isDirty?: boolean;
  }>(),
  {
    hasSets: false,
    isDirty: false,
  }
);

type MenuAction = 'new' | 'load' | 'save' | 'save-as' | 'add-set' | 'export';
type MenuName = 'file' | null;

const emit = defineEmits<{
  (e: MenuAction): void;
}>();

const activeMenu = ref<MenuName>(null);
const menuRef = ref<HTMLDivElement | null>(null);

function toggleMenu(menuName: MenuName): void {
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
}

function closeMenu(): void {
  activeMenu.value = null;
}

function handleAction(action: MenuAction): void {
  emit(action);
  closeMenu();
}

function handleClickOutside(event: MouseEvent): void {
  if (menuRef.value && event.target instanceof Node && !menuRef.value.contains(event.target)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="menu-bar no-print" ref="menuRef">
    <div class="menu-item" :class="{ active: activeMenu === 'file' }">
      <button class="menu-trigger" @click.stop="toggleMenu('file')">
        File
        <ChevronDown :size="14" />
      </button>
      <div v-if="activeMenu === 'file'" class="dropdown-menu">
        <button @click="handleAction('new')" class="dropdown-item">
          <FilePlus :size="16" /> New
        </button>
        <button @click="handleAction('load')" class="dropdown-item">
          <FolderOpen :size="16" /> Load
        </button>
        <div class="divider"></div>
        <button @click="handleAction('save')" class="dropdown-item">
          <Save :size="16" /> Save
        </button>
        <button @click="handleAction('save-as')" class="dropdown-item">
          <SaveAll :size="16" /> Save As...
        </button>
        <button @click="handleAction('export')" class="dropdown-item" :disabled="!hasSets">
          <FileDown :size="16" /> Export PDF
        </button>
      </div>
    </div>

    <button @click="handleAction('add-set')" class="menu-item">
      <PlusCircle :size="16" /> Add Set
    </button>

    <div v-if="isDirty" class="dirty-indicator">
      (edited)
    </div>
  </div>
</template>

<style scoped>
  .menu-bar {
    display: flex;
    gap: 0.5rem;
    background: #333;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    position: relative;
    z-index: 100;
    align-items: center;
  }

  .menu-item {
    position: relative;
  }

  .menu-trigger {
    background: transparent;
    border: none;
    color: #eee;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .menu-trigger:hover,
  .menu-item.active .menu-trigger {
    background: #444;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 6px;
    min-width: 180px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    padding: 0.5rem 0;
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
  }

  .dropdown-item {
    background: transparent;
    border: none;
    color: #ddd;
    padding: 0.6rem 1rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    width: 100%;
    transition: background-color 0.1s;
  }

  .dropdown-item:hover {
    background: #444;
    color: white;
  }

  .dropdown-item:disabled {
    color: #666;
    cursor: not-allowed;
  }

  .divider {
    height: 1px;
    background: #444;
    margin: 0.25rem 0;
  }

  .dirty-indicator {
    margin-left: auto;
    color: #eee;
    font-size: 0.9rem;
    opacity: 0.7;
    padding: 0 0.5rem;
  }
</style>
