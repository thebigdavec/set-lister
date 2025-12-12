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
    <!-- Burger menu button (mobile only) -->
    <Button
        class="burger-menu-button no-print"
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
        class="mobile-menu-overlay no-print"
        @click="closeMobileMenu"
        aria-hidden="true"
    ></div>

    <!-- Menu content (desktop always visible, mobile slide-in) -->
    <div class="menu-bar no-print" :class="{ 'mobile-open': isMobileMenuOpen }">
        <div>
            <div class="menu-items">
                <Tooltip
                    :text="`New Set List (${shortcuts.newDocument})`"
                    position="bottom"
                >
                    <Button
                        @click="handleAction('new')"
                        nowrap
                        class="action-item"
                        aria-describedby="tooltip-new"
                    >
                        <FilePlus class="icon" /> New
                    </Button>
                </Tooltip>
                <Tooltip
                    :text="`Open Set List (${shortcuts.open})`"
                    position="bottom"
                >
                    <Button
                        @click="handleAction('load')"
                        nowrap
                        class="action-item"
                        aria-describedby="tooltip-load"
                    >
                        <FolderOpen class="icon" /> Load
                    </Button>
                </Tooltip>
            </div>
            <div class="menu-items">
                <Tooltip
                    :text="`Save Set List (${shortcuts.save})`"
                    position="bottom"
                >
                    <Button
                        @click="handleAction('save')"
                        class="action-item"
                        nowrap
                        :class="{ 'dirty-indicator-text': isDirty }"
                        aria-describedby="tooltip-save"
                    >
                        <Save class="icon" /> Save
                        <span v-if="isDirty" class="dirty-indicator">*</span>
                    </Button>
                </Tooltip>
                <Tooltip
                    :text="`Save Set List As (${shortcuts.saveAs})`"
                    position="bottom"
                >
                    <Button
                        @click="handleAction('save-as')"
                        nowrap
                        class="action-item"
                        aria-describedby="tooltip-save-as"
                    >
                        <SaveAll class="icon" /> Save As
                    </Button>
                </Tooltip>
            </div>
        </div>
        <div>
            <div class="menu-items">
                <Tooltip :text="`Undo (${shortcuts.undo})`" position="bottom">
                    <Button
                        @click="handleAction('undo')"
                        nowrap
                        class="action-item"
                        :disabled="!canUndo"
                        aria-describedby="tooltip-undo"
                    >
                        <Undo2 class="icon" /> Undo
                    </Button>
                </Tooltip>
                <Tooltip :text="`Redo (${shortcuts.redo})`" position="bottom">
                    <Button
                        @click="handleAction('redo')"
                        nowrap
                        class="action-item"
                        :disabled="!canRedo"
                        aria-describedby="tooltip-redo"
                    >
                        <Redo2 class="icon" /> Redo
                    </Button>
                </Tooltip>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    position: absolute;
    top: 1rem;
    left: calc(100% - 1rem);
    transform: translateX(-100%);
    z-index: 1001;
    transition:
        left 0.25s ease,
        transform 0.25s ease;

    &.mobile-open {
        background-color: #400;
        left: 1rem;
        transform: translateX(0);
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
    justify-content: space-between;
    gap: 0.5rem;
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
    box-shadow: 0 2px 4px -2px #000;
    color: #ddd;
    transition:
        background-color 0.2s,
        ease color 0.2s ease,
        box-shadow 0.2s ease;

    &:hover {
        color: white;
        box-shadow: 0 3px 6px -2px #000;
    }

    &:disabled {
        color: #666;
        cursor: not-allowed;
    }
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

/* Mobile responsive styles */
@media (max-width: 767px) {
    /* Show burger button on mobile */
    .burger-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
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
    .menu-bar > * {
        width: 100%;
        flex-direction: column;
        gap: 0.5rem;
    }

    .menu-bar .menu-items {
        width: 100%;
        flex-direction: column;
    }

    .action-item {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
