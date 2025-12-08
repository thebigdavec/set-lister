<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
    FileDown,
    FilePlus,
    FolderOpen,
    Menu,
    PlusCircle,
    Save,
    SaveAll,
    X,
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
    <button
        class="burger-menu-button no-print"
        @click="toggleMobileMenu"
        aria-label="Toggle menu"
        :aria-expanded="isMobileMenuOpen"
    >
        <Menu v-if="!isMobileMenuOpen" :size="24" />
        <X v-else :size="24" />
    </button>

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
/* Burger menu button - hidden on desktop */
.burger-menu-button {
    display: none;
    background: #333;
    border: none;
    color: #ddd;
    padding: 0.6rem;
    cursor: pointer;
    border-radius: 6px;
    box-shadow: 0 2px 4px -2px #000;
    transition: background-color 0.2s;
    position: relative;
    z-index: 1001;
}

.burger-menu-button:hover {
    background: #444;
    color: white;
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
