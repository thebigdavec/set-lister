<script setup lang="ts">
import { withDefaults } from "vue";
import {
    FileDown,
    FilePlus,
    FolderOpen,
    PlusCircle,
    Save,
    SaveAll,
} from "lucide-vue-next";

withDefaults(
    defineProps<{
        hasSets?: boolean;
        isDirty?: boolean;
    }>(),
    {
        hasSets: false,
        isDirty: false,
    },
);

type MenuAction = "new" | "load" | "save" | "save-as" | "add-set" | "export";

const emit = defineEmits<{
    (e: MenuAction): void;
}>();

function handleAction(action: MenuAction): void {
    // Centralized emit so every button automatically closes transient UI if needed later
    emit(action);
}
</script>

<template>
    <div class="menu-bar no-print">
        <div>
            <div class="menu-items">
                <button @click="handleAction('new')" class="action-item">
                    <FilePlus :size="16" /> New
                </button>
                <button @click="handleAction('load')" class="action-item">
                    <FolderOpen :size="16" /> Load
                </button>
            </div>
            <div class="menu-items">
                <button
                    @click="handleAction('save')"
                    class="action-item"
                    :class="{ 'dirty-indicator-text': isDirty }"
                >
                    <Save :size="16" /> Save
                    <span v-if="isDirty" class="dirty-indicator">*</span>
                </button>
                <button @click="handleAction('save-as')" class="action-item">
                    <SaveAll :size="16" /> Save As...
                </button>
            </div>
        </div>
        <div>
            <div class="menu-items">
                <button @click="handleAction('add-set')" class="action-item">
                    <PlusCircle :size="16" /> Add Set
                </button>
                <button
                    @click="handleAction('export')"
                    class="action-item"
                    :disabled="!hasSets"
                >
                    <FileDown :size="16" /> Export PDF
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.menu-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    /*background: #222;*/
    /*border: 1px solid #444;*/
    /*padding: 0.5rem 1rem;*/
    /*border-radius: 6px;*/
    margin-bottom: 1rem;
    position: relative;
    z-index: 100;
    align-items: center;
    text-wrap: nowrap;

    > * {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        .menu-items {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
    }
}

.action-item {
    background: #333;
    box-shadow: 0 2px 4px -2px #000;
    border: none;
    color: #ddd;
    padding: 0.6rem 1rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    transition: background-color 0.2s;
}

.action-item:hover {
    background: #444;
    color: white;
    box-shadow: 0 3px 6px -2px #000;
}

.action-item:disabled {
    color: #666;
    cursor: not-allowed;
}

.divider {
    height: 1px;
    background: #444;
    margin: 0.25rem 0;
}

.dirty-indicator-text {
    outline: 2px solid #ee88;
}
.dirty-indicator {
    color: #ee8;
}
</style>
