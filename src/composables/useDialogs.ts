import { ref, readonly } from "vue";

/**
 * Dialog state for confirmation dialogs
 */
export interface ConfirmDialogState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

/**
 * Dialog state for alert dialogs
 */
export interface AlertDialogState {
  show: boolean;
  title: string;
  message: string;
  okText: string;
}

/**
 * Composable for promise-based dialog management.
 * Provides a clean API for showing confirmation and alert dialogs
 * that integrate with the ConfirmDialog component.
 */
export function useDialogs() {
  // Confirm dialog state
  const confirmDialogState = ref<ConfirmDialogState>({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    danger: false,
  });

  // Alert dialog state
  const alertDialogState = ref<AlertDialogState>({
    show: false,
    title: "",
    message: "",
    okText: "OK",
  });

  // Promise resolvers
  let confirmResolver: ((value: boolean) => void) | null = null;
  let alertResolver: (() => void) | null = null;

  /**
   * Show a confirmation dialog and wait for user response.
   * Returns a promise that resolves to true if confirmed, false if cancelled.
   */
  function showConfirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      confirmResolver = resolve;
      confirmDialogState.value = {
        show: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? "Confirm",
        cancelText: options.cancelText ?? "Cancel",
        danger: options.danger ?? false,
      };
    });
  }

  /**
   * Handle confirm button click
   */
  function handleConfirm(): void {
    confirmDialogState.value.show = false;
    if (confirmResolver) {
      confirmResolver(true);
      confirmResolver = null;
    }
  }

  /**
   * Handle cancel button click or dialog dismiss
   */
  function handleCancel(): void {
    confirmDialogState.value.show = false;
    if (confirmResolver) {
      confirmResolver(false);
      confirmResolver = null;
    }
  }

  /**
   * Show an alert dialog and wait for user acknowledgment.
   * Returns a promise that resolves when the user clicks OK.
   */
  function showAlert(options: {
    title: string;
    message: string;
    okText?: string;
  }): Promise<void> {
    return new Promise((resolve) => {
      alertResolver = resolve;
      alertDialogState.value = {
        show: true,
        title: options.title,
        message: options.message,
        okText: options.okText ?? "OK",
      };
    });
  }

  /**
   * Handle OK button click in alert dialog
   */
  function handleAlertOk(): void {
    alertDialogState.value.show = false;
    if (alertResolver) {
      alertResolver();
      alertResolver = null;
    }
  }

  return {
    // State (readonly to prevent external mutation)
    confirmDialog: readonly(confirmDialogState),
    alertDialog: readonly(alertDialogState),

    // Methods for showing dialogs
    showConfirm,
    showAlert,

    // Handlers for dialog events
    handleConfirm,
    handleCancel,
    handleAlertOk,
  };
}
