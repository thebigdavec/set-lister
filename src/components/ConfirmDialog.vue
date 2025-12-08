<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(
    defineProps<{
        /** Whether the dialog is visible */
        show: boolean;
        /** Dialog title */
        title: string;
        /** Dialog message/description */
        message: string;
        /** Text for the cancel button */
        cancelText?: string;
        /** Text for the confirm button */
        confirmText?: string;
        /** Whether the confirm action is destructive (styles button as danger) */
        danger?: boolean;
        /** Alert mode - shows only a single OK button instead of cancel/confirm */
        alertMode?: boolean;
        /** Text for the OK button in alert mode */
        okText?: string;
    }>(),
    {
        cancelText: "Cancel",
        confirmText: "Confirm",
        danger: false,
        alertMode: false,
        okText: "OK",
    },
);

const emit = defineEmits<{
    (e: "confirm"): void;
    (e: "cancel"): void;
    (e: "ok"): void;
}>();

const overlayRef = ref<HTMLDivElement | null>(null);

/**
 * Handle clicks on the overlay (outside the modal) to close
 */
function handleOverlayClick(event: MouseEvent): void {
    if (event.target === overlayRef.value) {
        emit("cancel");
    }
}

/**
 * Handle Escape key to close the dialog
 */
function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && props.show) {
        if (props.alertMode) {
            emit("ok");
        } else {
            emit("cancel");
        }
    }
}

/**
 * Handle OK button click in alert mode
 */
function handleOk(): void {
    emit("ok");
}

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="show"
                ref="overlayRef"
                class="modal-overlay"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="title"
                @click="handleOverlayClick"
            >
                <div class="modal">
                    <h3>{{ title }}</h3>
                    <p>{{ message }}</p>
                    <slot></slot>
                    <div class="modal-actions">
                        <!-- Alert mode: single OK button -->
                        <template v-if="alertMode">
                            <button @click="handleOk" class="confirm-btn">
                                {{ okText }}
                            </button>
                        </template>
                        <!-- Confirm mode: cancel and confirm buttons -->
                        <template v-else>
                            <button @click="emit('cancel')" class="cancel-btn">
                                {{ cancelText }}
                            </button>
                            <button
                                @click="emit('confirm')"
                                :class="['confirm-btn', { danger }]"
                            >
                                {{ confirmText }}
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
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

.cancel-btn {
    background: #555;
    color: #ddd;
    border: 1px solid #666;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.cancel-btn:hover {
    background: #666;
}

.confirm-btn {
    background: var(--accent-color, #646cff);
    color: white;
    border: 1px solid var(--accent-color, #646cff);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.confirm-btn:hover {
    background: #535bf2;
    border-color: #535bf2;
}

.confirm-btn.danger {
    background-color: #ff4444;
    border-color: #ff4444;
}

.confirm-btn.danger:hover {
    background-color: #cc0000;
    border-color: #cc0000;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
