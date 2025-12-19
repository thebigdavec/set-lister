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
		/** Text for the cancel Button */
		cancelText?: string;
		/** Text for the confirm Button */
		confirmText?: string;
		/** Whether the confirm action is destructive (styles Button as danger) */
		danger?: boolean;
		/** Alert mode - shows only a single OK Button instead of cancel/confirm */
		alertMode?: boolean;
		/** Text for the OK Button in alert mode */
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
 * Handle OK Button click in alert mode
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
						<!-- Alert mode: single OK Button -->
						<template v-if="alertMode">
							<Button @click="handleOk" class="primary">
								{{ okText }}
							</Button>
						</template>
						<!-- Confirm mode: cancel and confirm Buttons -->
						<template v-else>
							<Button @click="emit('cancel')">
								{{ cancelText }}
							</Button>
							<Button
								@click="emit('confirm')"
								:class="danger ? 'danger' : 'primary'"
							>
								{{ confirmText }}
							</Button>
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
	background-color: var(--card-bg);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 2000;
}

.modal {
	background: var(--card-bg-1);
	padding: 2rem;
	border-radius: 8px;
	max-width: 400px;
	width: 90%;
	box-shadow: 0 4px 20px var(--shadow-color);
}

.modal h3 {
	margin-top: 0;
	color: var(--text-color);
}

.modal p {
	color: var(--text-color-1);
	margin-bottom: 2rem;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
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
