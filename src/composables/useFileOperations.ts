import { ref } from "vue";
import { loadStore, markClean, store } from "../store";

/**
 * Options for useFileOperations composable
 */
export interface FileOperationsOptions {
  /**
   * Show a confirmation dialog and return a promise that resolves to true if confirmed.
   * If not provided, falls back to native confirm().
   */
  showConfirm?: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }) => Promise<boolean>;

  /**
   * Show an alert dialog and return a promise that resolves when acknowledged.
   * If not provided, falls back to native alert().
   */
  showAlert?: (options: {
    title: string;
    message: string;
    okText?: string;
  }) => Promise<void>;
}

/**
 * Composable for file save/load operations using File System Access API
 * with fallbacks for browsers that don't support it.
 */
export function useFileOperations(options: FileOperationsOptions = {}) {
  const { showConfirm, showAlert } = options;
  const currentFileHandle = ref<FileSystemFileHandle | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);

  type SaveEvent =
    | MouseEvent
    | KeyboardEvent
    | { altKey?: boolean }
    | undefined;

  /**
   * Save the current set list to disk.
   * Uses File System Access API if available, otherwise falls back to download.
   * @param event - Optional event to check for altKey (Save As)
   */
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
        // Fallback for browsers without File System Access API
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
        if (showAlert) {
          await showAlert({
            title: "Save Error",
            message: "Failed to save file. Please try again.",
          });
        } else {
          alert("Failed to save file.");
        }
      }
    }
  }

  /**
   * Load a set list from disk.
   * Uses File System Access API if available, otherwise falls back to file input.
   */
  async function loadFromDisk(): Promise<void> {
    if (store.isDirty) {
      let confirmed: boolean;
      if (showConfirm) {
        confirmed = await showConfirm({
          title: "Unsaved Changes",
          message:
            "You have unsaved changes. Are you sure you want to load a new file? Unsaved changes will be lost.",
          confirmText: "Load File",
          cancelText: "Cancel",
          danger: true,
        });
      } else {
        confirmed = confirm(
          "You have unsaved changes. Are you sure you want to load a new file? Unsaved changes will be lost.",
        );
      }
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
          if (showAlert) {
            await showAlert({
              title: "Invalid File",
              message: "The selected file is not a valid set list file.",
            });
          } else {
            alert("Invalid set list file.");
          }
        }
      } else {
        // Fallback for browsers without File System Access API
        fileInput.value?.click();
      }
    } catch (err) {
      const error = err as DOMException;
      if (error.name !== "AbortError") {
        console.error("Failed to load file:", err);
        if (showAlert) {
          await showAlert({
            title: "Load Error",
            message: "Failed to load file. Please try again.",
          });
        } else {
          alert("Failed to load file.");
        }
      }
    }
  }

  /**
   * Handle file input change event (fallback for browsers without File System Access API)
   */
  async function handleFileInputChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (loadStore(data)) {
        currentFileHandle.value = null;
      } else {
        if (showAlert) {
          await showAlert({
            title: "Invalid File",
            message: "The selected file is not a valid set list file.",
          });
        } else {
          alert("Invalid set list file.");
        }
      }
    } catch (err) {
      console.error("Failed to load file:", err);
      if (showAlert) {
        await showAlert({
          title: "Load Error",
          message: "Failed to load file. Please try again.",
        });
      } else {
        alert("Failed to load file.");
      }
    }

    // Reset the input so the same file can be selected again
    input.value = "";
  }

  /**
   * Clear the current file handle (used when starting a new set list)
   */
  function clearFileHandle(): void {
    currentFileHandle.value = null;
  }

  /**
   * Handle beforeunload event to warn about unsaved changes
   */
  function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (store.isDirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  return {
    currentFileHandle,
    fileInput,
    saveToDisk,
    loadFromDisk,
    handleFileInputChange,
    clearFileHandle,
    handleBeforeUnload,
  };
}
