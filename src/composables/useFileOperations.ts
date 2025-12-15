import { ref } from "vue";
import { isDirty, loadStore, markClean, store } from "../store";

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
 * IndexedDB database name and store for persisting file handles
 */
const DB_NAME = "set-lister-file-handles";
const STORE_NAME = "handles";
const HANDLE_KEY = "currentFileHandle";

/**
 * Module-level file handle that persists across component re-mounts and HMR.
 * This ensures we don't lose track of the current file when the component re-renders.
 */
const currentFileHandle = ref<FileSystemFileHandle | null>(null);

/**
 * Flag to track if we've attempted to restore the handle from IndexedDB
 */
let handleRestoreAttempted = false;

/**
 * Open the IndexedDB database for file handle storage
 */
function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onerror = () => {
			reject(request.error);
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

/**
 * Save the current file handle to IndexedDB for persistence across sessions
 */
async function saveHandleToIndexedDB(
	handle: FileSystemFileHandle | null,
): Promise<void> {
	try {
		const db = await openDatabase();
		const transaction = db.transaction(STORE_NAME, "readwrite");
		const store = transaction.objectStore(STORE_NAME);

		if (handle) {
			store.put(handle, HANDLE_KEY);
		} else {
			store.delete(HANDLE_KEY);
		}

		return new Promise((resolve, reject) => {
			transaction.oncomplete = () => {
				db.close();
				resolve();
			};
			transaction.onerror = () => {
				db.close();
				reject(transaction.error);
			};
		});
	} catch (err) {
		console.warn("Failed to save file handle to IndexedDB:", err);
	}
}

/**
 * Restore the file handle from IndexedDB and request permission to use it
 */
async function restoreHandleFromIndexedDB(): Promise<FileSystemFileHandle | null> {
	try {
		const db = await openDatabase();
		const transaction = db.transaction(STORE_NAME, "readonly");
		const objectStore = transaction.objectStore(STORE_NAME);

		return new Promise((resolve, reject) => {
			const request = objectStore.get(HANDLE_KEY);

			request.onsuccess = async () => {
				db.close();
				const handle = request.result as FileSystemFileHandle | undefined;

				if (!handle) {
					resolve(null);
					return;
				}

				// Check if we still have permission to access the file
				try {
					const permission = await handle.queryPermission({
						mode: "readwrite",
					});
					if (permission === "granted") {
						resolve(handle);
						return;
					}

					// Try to request permission (requires user gesture, so this may fail)
					// We'll just return null if we can't get permission - the user can re-open the file
					const requestResult = await handle.requestPermission({
						mode: "readwrite",
					});
					if (requestResult === "granted") {
						resolve(handle);
					} else {
						resolve(null);
					}
				} catch {
					// Permission request failed (likely no user gesture)
					resolve(null);
				}
			};

			request.onerror = () => {
				db.close();
				reject(request.error);
			};
		});
	} catch (err) {
		console.warn("Failed to restore file handle from IndexedDB:", err);
		return null;
	}
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
 * Composable for file save/load operations using File System Access API
 * with fallbacks for browsers that don't support it.
 */
export function useFileOperations(options: FileOperationsOptions = {}) {
	const { showConfirm, showAlert, onLoad } = options;
	const fileInput = ref<HTMLInputElement | null>(null);

	type SaveEvent =
		| MouseEvent
		| KeyboardEvent
		| { altKey?: boolean }
		| undefined;

	/**
	 * Attempt to restore the file handle from IndexedDB on first use.
	 * This is called lazily to avoid blocking initialization.
	 */
	async function tryRestoreHandle(): Promise<void> {
		if (handleRestoreAttempted || currentFileHandle.value) {
			return;
		}
		handleRestoreAttempted = true;

		// Only attempt if File System Access API is available
		if (
			"showSaveFilePicker" in window &&
			typeof window.showSaveFilePicker === "function"
		) {
			const handle = await restoreHandleFromIndexedDB();
			if (handle) {
				currentFileHandle.value = handle;
			}
		}
	}

	/**
	 * Save the current set list to disk.
	 * Uses File System Access API if available, otherwise falls back to download.
	 * @param event - Optional event to check for altKey (Save As)
	 */
	async function saveToDisk(event?: SaveEvent): Promise<void> {
		// Try to restore handle from IndexedDB first
		await tryRestoreHandle();

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
					// Generate suggested filename - use copy name if we have an existing file
					let suggestedName: string;
					if (currentFileHandle.value) {
						// Save As on existing file - suggest a copy name with -01, -02, etc.
						suggestedName = generateCopyFilename(currentFileHandle.value.name);
					} else {
						// New file - use the set list name
						suggestedName = `${store.metadata.setListName || "set-list"}.json`;
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
					// Persist the new handle to IndexedDB
					await saveHandleToIndexedDB(handle);
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
					// Persist the handle to IndexedDB
					await saveHandleToIndexedDB(handle);
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
				currentFileHandle.value = null;
				// Clear the persisted handle since we loaded via fallback
				await saveHandleToIndexedDB(null);
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
	 * Clear the current file handle (used when starting a new set list)
	 */
	async function clearFileHandle(): Promise<void> {
		currentFileHandle.value = null;
		await saveHandleToIndexedDB(null);
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
		fileInput,
		saveToDisk,
		loadFromDisk,
		handleFileInputChange,
		clearFileHandle,
		handleBeforeUnload,
	};
}

/**
 * Reset the handle restore flag (for testing purposes)
 */
export function _resetHandleRestoreFlag(): void {
	handleRestoreAttempted = false;
}

/**
 * Export generateCopyFilename for testing
 */
export { generateCopyFilename as _generateCopyFilename };
