import { ref, computed } from "vue";
import { isDirty, loadStore, markClean, store } from "../store";
import { generateSlugFromArray } from "../utils/generateSlugFromArray";

/**
 * LocalStorage key for persisting the current filename
 */
const FILENAME_STORAGE_KEY = "set-lister-current-filename";

/**
 * Generate a suggested filename for "Save As" / "Save a Copy" by appending -01, -02, etc.
 * If the original filename is "my-setlist.json", returns "my-setlist-01.json".
 * If it already has a suffix like "my-setlist-01.json", returns "my-setlist-02.json".
 */
function generateCopyFilename(originalName: string): string {
	// Remove .json extension if present
	const hasJsonExt = originalName.toLowerCase().endsWith(".json");
	const baseName = hasJsonExt ? originalName.slice(0, -5) : originalName;

	// Check if the name already ends with a -NN pattern
	const suffixMatch = baseName.match(/^(.+)-(\d{2})$/);

	if (suffixMatch) {
		// Increment the existing suffix
		const nameWithoutSuffix = suffixMatch[1];
		const currentNumber = parseInt(suffixMatch[2], 10);
		const nextNumber = String(currentNumber + 1).padStart(2, "0");
		return `${nameWithoutSuffix}-${nextNumber}.json`;
	} else {
		// Add -01 suffix
		return `${baseName}-01.json`;
	}
}

/**
 * Module-level state that persists across component re-mounts and HMR.
 */
const currentFileHandle = ref<FileSystemFileHandle | null>(null);
const currentFilename = ref<string | null>(null);

// Restore filename from localStorage on module load
try {
	const savedFilename = localStorage.getItem(FILENAME_STORAGE_KEY);
	if (savedFilename) {
		currentFilename.value = savedFilename;
	}
} catch {
	// Ignore localStorage errors
}

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

	/**
	 * Callback invoked after successfully loading a file.
	 * Useful for clearing undo/redo history.
	 */
	onLoad?: () => void;
}

/**
 * Save the current filename to localStorage
 */
function saveFilenameToStorage(filename: string | null): void {
	try {
		if (filename) {
			localStorage.setItem(FILENAME_STORAGE_KEY, filename);
		} else {
			localStorage.removeItem(FILENAME_STORAGE_KEY);
		}
	} catch {
		// Ignore localStorage errors
	}
}

/**
 * Composable for file save/load operations using File System Access API
 * with fallbacks for browsers that don't support it.
 */
export function useFileOperations(options: FileOperationsOptions = {}) {
	const { showConfirm, showAlert, onLoad } = options;
	const fileInput = ref<HTMLInputElement | null>(null);

	/**
	 * The display name of the current file (without path)
	 */
	const displayFilename = computed(() => currentFilename.value);

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
				const isSaveAs = Boolean(event && "altKey" in event && event.altKey);
				const hasExistingHandle = Boolean(currentFileHandle.value);

				// Determine if we need to show the picker
				const showPicker = isSaveAs || !hasExistingHandle;

				if (showPicker) {
					// Generate suggested filename
					let suggestedName: string;
					if (isSaveAs && currentFilename.value) {
						// Save As on existing file - suggest a copy name with -01, -02, etc.
						suggestedName = generateCopyFilename(currentFilename.value);
					} else if (currentFilename.value) {
						// Use current filename
						suggestedName = currentFilename.value;
					} else {
						// New file - use the set list name
						suggestedName = generateSlugFromArray([
							store.metadata.setListName,
							store.metadata.actName,
						]);
					}

					const handle = await window.showSaveFilePicker({
						suggestedName,
						types: [
							{
								description: "JSON Files",
								accept: { "application/json": [".json"] },
							},
						],
					});
					currentFileHandle.value = handle;
					currentFilename.value = handle.name;
					saveFilenameToStorage(handle.name);
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

				// Use current filename or generate one
				let downloadName: string;
				if (currentFilename.value) {
					const isSaveAs = Boolean(event && "altKey" in event && event.altKey);
					downloadName = isSaveAs
						? generateCopyFilename(currentFilename.value)
						: currentFilename.value;
				} else {
					downloadName = `${store.metadata.setListName || "set-list"}.json`;
				}

				anchor.download = downloadName;
				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);
				URL.revokeObjectURL(url);

				// Update filename (user may have changed it in the save dialog, but we can't know)
				currentFilename.value = downloadName;
				saveFilenameToStorage(downloadName);
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
		if (isDirty.value) {
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
					currentFilename.value = handle.name;
					saveFilenameToStorage(handle.name);
					onLoad?.();
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
				// No file handle in fallback mode
				currentFileHandle.value = null;
				currentFilename.value = file.name;
				saveFilenameToStorage(file.name);
				onLoad?.();
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
	 * Clear the current file handle and filename (used when starting a new set list)
	 */
	function clearFileHandle(): void {
		currentFileHandle.value = null;
		currentFilename.value = null;
		saveFilenameToStorage(null);
	}

	/**
	 * Handle beforeunload event to warn about unsaved changes
	 */
	function handleBeforeUnload(event: BeforeUnloadEvent): void {
		if (isDirty.value) {
			event.preventDefault();
			event.returnValue = "";
		}
	}

	return {
		currentFileHandle,
		currentFilename: displayFilename,
		fileInput,
		saveToDisk,
		loadFromDisk,
		handleFileInputChange,
		clearFileHandle,
		handleBeforeUnload,
	};
}

/**
 * Reset module-level state (for testing purposes)
 */
export function _resetFileState(): void {
	currentFileHandle.value = null;
	currentFilename.value = null;
	try {
		localStorage.removeItem(FILENAME_STORAGE_KEY);
	} catch {
		// Ignore localStorage errors
	}
}

/**
 * Export generateCopyFilename for testing
 */
export { generateCopyFilename as _generateCopyFilename };
