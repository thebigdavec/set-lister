import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	useFileOperations,
	_resetFileState,
	_generateCopyFilename,
} from "../useFileOperations";
import {
	store,
	isDirty,
	resetStore,
	addSongToSet,
	markClean,
} from "../../store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const windowAny = window as any;

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
	};
})();

Object.defineProperty(global, "localStorage", {
	value: localStorageMock,
});

// Mock window.alert and window.confirm
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

// Mock canvas getContext for textMetrics
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
	const element = originalCreateElement(tagName);
	if (tagName === "canvas") {
		(element as HTMLCanvasElement).getContext = vi.fn(() => ({
			measureText: vi.fn(() => ({ width: 100 })),
			font: "",
		})) as unknown as HTMLCanvasElement["getContext"];
	}
	return element;
});

describe("useFileOperations", () => {
	beforeEach(() => {
		resetStore();
		localStorageMock.clear();
		vi.clearAllMocks();
		// Reset the module-level file state between tests
		_resetFileState();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("generateCopyFilename", () => {
		it("should add -01 suffix to filename without suffix", () => {
			expect(_generateCopyFilename("my-setlist.json")).toBe(
				"my-setlist-01.json",
			);
		});

		it("should increment existing -01 suffix to -02", () => {
			expect(_generateCopyFilename("my-setlist-01.json")).toBe(
				"my-setlist-02.json",
			);
		});

		it("should increment -09 to -10", () => {
			expect(_generateCopyFilename("my-setlist-09.json")).toBe(
				"my-setlist-10.json",
			);
		});

		it("should increment -99 to -100", () => {
			expect(_generateCopyFilename("my-setlist-99.json")).toBe(
				"my-setlist-100.json",
			);
		});

		it("should handle filename without .json extension", () => {
			expect(_generateCopyFilename("my-setlist")).toBe("my-setlist-01.json");
		});

		it("should handle filename with uppercase .JSON extension", () => {
			expect(_generateCopyFilename("my-setlist.JSON")).toBe(
				"my-setlist-01.json",
			);
		});

		it("should not confuse numbers in filename with suffix", () => {
			expect(_generateCopyFilename("show-2024.json")).toBe("show-2024-01.json");
		});

		it("should handle filename that ends with single digit", () => {
			expect(_generateCopyFilename("set-1.json")).toBe("set-1-01.json");
		});

		it("should handle empty base name", () => {
			expect(_generateCopyFilename(".json")).toBe("-01.json");
		});

		it("should preserve hyphens in original filename", () => {
			expect(_generateCopyFilename("my-cool-setlist-name.json")).toBe(
				"my-cool-setlist-name-01.json",
			);
		});
	});

	describe("initialization", () => {
		it("should return all expected properties", () => {
			const ops = useFileOperations();

			expect(ops).toHaveProperty("currentFileHandle");
			expect(ops).toHaveProperty("fileInput");
			expect(ops).toHaveProperty("saveToDisk");
			expect(ops).toHaveProperty("loadFromDisk");
			expect(ops).toHaveProperty("handleFileInputChange");
			expect(ops).toHaveProperty("clearFileHandle");
			expect(ops).toHaveProperty("handleBeforeUnload");
		});

		it("should have null initial file handle", () => {
			const { currentFileHandle } = useFileOperations();
			expect(currentFileHandle.value).toBe(null);
		});

		it("should have null initial file input ref", () => {
			const { fileInput } = useFileOperations();
			expect(fileInput.value).toBe(null);
		});
	});

	describe("clearFileHandle", () => {
		it("should set currentFileHandle to null", () => {
			const { currentFileHandle, clearFileHandle } = useFileOperations();

			// Simulate having a file handle (we can't actually set it due to types,
			// but we can test the function)
			clearFileHandle();

			expect(currentFileHandle.value).toBe(null);
		});
	});

	describe("file handle and filename persistence", () => {
		it("should share file handle across multiple useFileOperations() calls", async () => {
			// This test verifies the fix for the bug where the save dialog would
			// appear even for previously saved documents. The file handle must
			// persist across multiple calls to useFileOperations() (e.g., after HMR).

			const mockWritable = {
				write: vi.fn().mockResolvedValue(undefined),
				close: vi.fn().mockResolvedValue(undefined),
			};
			const mockHandle = {
				name: "test-file.json",
				createWritable: vi.fn().mockResolvedValue(mockWritable),
			};
			windowAny.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);

			// First instance saves and gets a handle
			const ops1 = useFileOperations();
			await ops1.saveToDisk();
			expect(ops1.currentFileHandle.value).toStrictEqual(mockHandle);
			expect(ops1.currentFilename.value).toBe("test-file.json");
			expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);

			// Second instance (simulating component re-mount/HMR) should see the same handle
			const ops2 = useFileOperations();
			expect(ops2.currentFileHandle.value).toStrictEqual(mockHandle);
			expect(ops2.currentFilename.value).toBe("test-file.json");

			// Saving from second instance should NOT show picker (handle exists)
			await ops2.saveToDisk();
			expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1); // Still 1, not 2

			// Cleanup
			delete windowAny.showSaveFilePicker;
		});

		it("should persist filename to localStorage", async () => {
			const mockWritable = {
				write: vi.fn().mockResolvedValue(undefined),
				close: vi.fn().mockResolvedValue(undefined),
			};
			const mockHandle = {
				name: "my-setlist.json",
				createWritable: vi.fn().mockResolvedValue(mockWritable),
			};
			windowAny.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);

			const { saveToDisk } = useFileOperations();
			await saveToDisk();

			// Should have saved filename to localStorage
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"set-lister-current-filename",
				"my-setlist.json",
			);

			// Cleanup
			delete windowAny.showSaveFilePicker;
		});

		it("should clear filename from localStorage when clearing file handle", () => {
			const { clearFileHandle } = useFileOperations();
			clearFileHandle();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"set-lister-current-filename",
			);
		});
	});

	describe("handleBeforeUnload", () => {
		it("should not prevent unload when store is clean", () => {
			markClean();
			const { handleBeforeUnload } = useFileOperations();

			const event = new Event("beforeunload") as BeforeUnloadEvent;
			const preventDefaultSpy = vi.spyOn(event, "preventDefault");

			handleBeforeUnload(event);

			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});

		it("should prevent unload when store is dirty", () => {
			addSongToSet(store.sets[0].id, { title: "Test" });
			expect(isDirty.value).toBe(true);

			const { handleBeforeUnload } = useFileOperations();

			const event = {
				preventDefault: vi.fn(),
				returnValue: "",
			} as unknown as BeforeUnloadEvent;

			handleBeforeUnload(event);

			expect(event.preventDefault).toHaveBeenCalled();
			expect(event.returnValue).toBe("");
		});
	});

	describe("saveToDisk", () => {
		describe("fallback (no File System Access API)", () => {
			let createElementSpy: ReturnType<typeof vi.spyOn>;
			let appendChildSpy: ReturnType<typeof vi.spyOn>;
			let removeChildSpy: ReturnType<typeof vi.spyOn>;
			let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
			let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

			beforeEach(() => {
				// Ensure showSaveFilePicker is not available
				if ("showSaveFilePicker" in window) {
					delete windowAny.showSaveFilePicker;
				}

				const mockAnchor = {
					href: "",
					download: "",
					click: vi.fn(),
				};

				createElementSpy = vi
					.spyOn(document, "createElement")
					.mockReturnValue(mockAnchor as unknown as HTMLElement);
				appendChildSpy = vi
					.spyOn(document.body, "appendChild")
					.mockImplementation((node) => node);
				removeChildSpy = vi
					.spyOn(document.body, "removeChild")
					.mockImplementation((node) => node);
				createObjectURLSpy = vi
					.spyOn(URL, "createObjectURL")
					.mockReturnValue("blob:test");
				revokeObjectURLSpy = vi
					.spyOn(URL, "revokeObjectURL")
					.mockImplementation(() => {});
			});

			afterEach(() => {
				createElementSpy.mockRestore();
				appendChildSpy.mockRestore();
				removeChildSpy.mockRestore();
				createObjectURLSpy.mockRestore();
				revokeObjectURLSpy.mockRestore();
			});

			it("should create download link with correct filename", async () => {
				store.metadata.setListName = "My Show";
				const { saveToDisk } = useFileOperations();

				await saveToDisk();

				expect(createElementSpy).toHaveBeenCalledWith("a");
			});

			it("should use default filename when setListName is empty", async () => {
				store.metadata.setListName = "";
				const { saveToDisk } = useFileOperations();

				await saveToDisk();

				expect(createElementSpy).toHaveBeenCalled();
			});

			it("should mark store as clean after save", async () => {
				// Make the store dirty by changing metadata
				store.metadata.setListName = "Dirty Test";
				expect(isDirty.value).toBe(true);

				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(isDirty.value).toBe(false);
			});

			it("should create and revoke object URL", async () => {
				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(createObjectURLSpy).toHaveBeenCalled();
				expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test");
			});
		});

		describe("with File System Access API", () => {
			let mockWritable: {
				write: ReturnType<typeof vi.fn>;
				close: ReturnType<typeof vi.fn>;
			};
			let mockHandle: {
				name: string;
				createWritable: ReturnType<typeof vi.fn>;
			};

			beforeEach(() => {
				mockWritable = {
					write: vi.fn().mockResolvedValue(undefined),
					close: vi.fn().mockResolvedValue(undefined),
				};
				mockHandle = {
					name: "test-file.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				windowAny.showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);
			});

			afterEach(() => {
				delete windowAny.showSaveFilePicker;
			});

			it("should show file picker when no handle exists", async () => {
				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(window.showSaveFilePicker).toHaveBeenCalled();
			});

			it("should write JSON data to file", async () => {
				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(mockWritable.write).toHaveBeenCalled();
				const writeArg = mockWritable.write.mock.calls[0][0];
				const parsed = JSON.parse(writeArg);
				expect(parsed).toHaveProperty("metadata");
				expect(parsed).toHaveProperty("sets");
			});

			it("should close writable after writing", async () => {
				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(mockWritable.close).toHaveBeenCalled();
			});

			it("should mark store clean after successful save", async () => {
				addSongToSet(store.sets[0].id, { title: "Test" });
				expect(isDirty.value).toBe(true);

				const { saveToDisk } = useFileOperations();
				await saveToDisk();

				expect(isDirty.value).toBe(false);
			});

			it("should show Save As when altKey is pressed", async () => {
				const { saveToDisk, currentFileHandle } = useFileOperations();
				// First save to get a handle
				await saveToDisk();
				const firstHandle = currentFileHandle.value;

				// Create new mock for second save
				const newMockHandle = {
					name: "test-file-01.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				(
					window.showSaveFilePicker as ReturnType<typeof vi.fn>
				).mockResolvedValue(newMockHandle);

				// Save with altKey
				await saveToDisk({ altKey: true });

				// Should have called picker again
				expect(window.showSaveFilePicker).toHaveBeenCalledTimes(2);
			});

			it("should suggest copy filename with -01 suffix when Save As on existing file", async () => {
				// Create a mock handle with a filename
				const existingHandle = {
					name: "my-setlist.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				windowAny.showSaveFilePicker = vi
					.fn()
					.mockResolvedValue(existingHandle);

				const { saveToDisk } = useFileOperations();

				// First save to establish the handle
				await saveToDisk();
				expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);

				// Create new mock for Save As
				const newHandle = {
					name: "my-setlist-01.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				(
					window.showSaveFilePicker as ReturnType<typeof vi.fn>
				).mockResolvedValue(newHandle);

				// Save As (altKey)
				await saveToDisk({ altKey: true });

				// Should have suggested the copy filename
				expect(window.showSaveFilePicker).toHaveBeenCalledTimes(2);
				expect(window.showSaveFilePicker).toHaveBeenLastCalledWith({
					suggestedName: "my-setlist-01.json",
					types: [
						{
							description: "JSON Files",
							accept: { "application/json": [".json"] },
						},
					],
				});
			});

			it("should increment suffix when Save As on file already ending with -01", async () => {
				// Create a mock handle with a filename that already has -01
				const existingHandle = {
					name: "my-setlist-01.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				windowAny.showSaveFilePicker = vi
					.fn()
					.mockResolvedValue(existingHandle);

				const { saveToDisk } = useFileOperations();

				// First save to establish the handle
				await saveToDisk();

				// Create new mock for Save As
				const newHandle = {
					name: "my-setlist-02.json",
					createWritable: vi.fn().mockResolvedValue(mockWritable),
				};
				(
					window.showSaveFilePicker as ReturnType<typeof vi.fn>
				).mockResolvedValue(newHandle);

				// Save As (altKey)
				await saveToDisk({ altKey: true });

				// Should have suggested the incremented filename
				expect(window.showSaveFilePicker).toHaveBeenLastCalledWith({
					suggestedName: "my-setlist-02.json",
					types: [
						{
							description: "JSON Files",
							accept: { "application/json": [".json"] },
						},
					],
				});
			});

			it("should not show error on AbortError", async () => {
				const abortError = new DOMException("User cancelled", "AbortError");
				(
					window.showSaveFilePicker as ReturnType<typeof vi.fn>
				).mockRejectedValue(abortError);

				const showAlert = vi.fn();
				const { saveToDisk } = useFileOperations({ showAlert });

				await saveToDisk();

				expect(showAlert).not.toHaveBeenCalled();
			});

			it("should show alert on other errors", async () => {
				const error = new Error("Some error");
				(
					window.showSaveFilePicker as ReturnType<typeof vi.fn>
				).mockRejectedValue(error);

				const showAlert = vi.fn().mockResolvedValue(undefined);
				const { saveToDisk } = useFileOperations({ showAlert });

				await saveToDisk();

				expect(showAlert).toHaveBeenCalledWith({
					title: "Save Error",
					message: "Failed to save file. Please try again.",
				});
			});
		});
	});

	describe("loadFromDisk", () => {
		describe("dirty state handling", () => {
			it("should show confirm dialog when store is dirty", async () => {
				addSongToSet(store.sets[0].id, { title: "Test" });
				expect(isDirty.value).toBe(true);

				const showConfirm = vi.fn().mockResolvedValue(false);
				const { loadFromDisk } = useFileOperations({ showConfirm });

				await loadFromDisk();

				expect(showConfirm).toHaveBeenCalledWith({
					title: "Unsaved Changes",
					message:
						"You have unsaved changes. Are you sure you want to load a new file? Unsaved changes will be lost.",
					confirmText: "Load File",
					cancelText: "Cancel",
					danger: true,
				});
			});

			it("should abort if user cancels confirm dialog", async () => {
				addSongToSet(store.sets[0].id, { title: "Test" });

				const showConfirm = vi.fn().mockResolvedValue(false);
				const { loadFromDisk, fileInput } = useFileOperations({ showConfirm });

				// Create mock file input
				const mockInput = { click: vi.fn() };
				fileInput.value = mockInput as unknown as HTMLInputElement;

				await loadFromDisk();

				expect(mockInput.click).not.toHaveBeenCalled();
			});

			it("should proceed if user confirms", async () => {
				addSongToSet(store.sets[0].id, { title: "Test" });

				const showConfirm = vi.fn().mockResolvedValue(true);
				const { loadFromDisk, fileInput } = useFileOperations({ showConfirm });

				// Create mock file input
				const mockInput = { click: vi.fn() };
				fileInput.value = mockInput as unknown as HTMLInputElement;

				// No File System Access API, so it will use fallback
				if ("showOpenFilePicker" in window) {
					delete windowAny.showOpenFilePicker;
				}

				await loadFromDisk();

				expect(mockInput.click).toHaveBeenCalled();
			});

			it("should not show confirm when store is clean", async () => {
				markClean();

				const showConfirm = vi.fn();
				const { loadFromDisk, fileInput } = useFileOperations({ showConfirm });

				const mockInput = { click: vi.fn() };
				fileInput.value = mockInput as unknown as HTMLInputElement;

				if ("showOpenFilePicker" in window) {
					delete windowAny.showOpenFilePicker;
				}

				await loadFromDisk();

				expect(showConfirm).not.toHaveBeenCalled();
			});
		});

		describe("fallback (no File System Access API)", () => {
			beforeEach(() => {
				if ("showOpenFilePicker" in window) {
					delete windowAny.showOpenFilePicker;
				}
			});

			it("should click file input when API not available", async () => {
				markClean();
				const { loadFromDisk, fileInput } = useFileOperations();

				const mockInput = { click: vi.fn() };
				fileInput.value = mockInput as unknown as HTMLInputElement;

				await loadFromDisk();

				expect(mockInput.click).toHaveBeenCalled();
			});
		});

		describe("with File System Access API", () => {
			beforeEach(() => {
				markClean();
			});

			afterEach(() => {
				delete windowAny.showOpenFilePicker;
			});

			it("should load valid JSON file", async () => {
				const validData = {
					metadata: {
						setListName: "Loaded Show",
						venue: "The Venue",
						date: "2024-01-01",
						actName: "The Band",
					},
					sets: [
						{
							id: "set-1",
							name: "Set 1",
							songs: [{ id: "song-1", title: "Song 1" }],
						},
					],
				};

				const mockFile = {
					text: vi.fn().mockResolvedValue(JSON.stringify(validData)),
				};
				const mockHandle = {
					getFile: vi.fn().mockResolvedValue(mockFile),
				};

				windowAny.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);

				const { loadFromDisk, currentFileHandle } = useFileOperations();
				await loadFromDisk();

				expect(store.metadata.setListName).toBe("Loaded Show");
				expect(store.sets[0].songs[0].title).toBe("Song 1");
				expect(currentFileHandle.value).toStrictEqual(mockHandle);
			});

			it("should show alert for invalid file", async () => {
				const invalidData = { notValid: true };

				const mockFile = {
					text: vi.fn().mockResolvedValue(JSON.stringify(invalidData)),
				};
				const mockHandle = {
					getFile: vi.fn().mockResolvedValue(mockFile),
				};

				windowAny.showOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);

				const showAlert = vi.fn().mockResolvedValue(undefined);
				const { loadFromDisk } = useFileOperations({ showAlert });
				await loadFromDisk();

				expect(showAlert).toHaveBeenCalledWith({
					title: "Invalid File",
					message: "The selected file is not a valid set list file.",
				});
			});

			it("should not show error on AbortError", async () => {
				const abortError = new DOMException("User cancelled", "AbortError");
				windowAny.showOpenFilePicker = vi.fn().mockRejectedValue(abortError);

				const showAlert = vi.fn();
				const { loadFromDisk } = useFileOperations({ showAlert });

				await loadFromDisk();

				expect(showAlert).not.toHaveBeenCalled();
			});

			it("should show alert on other errors", async () => {
				const error = new Error("Some error");
				windowAny.showOpenFilePicker = vi.fn().mockRejectedValue(error);

				const showAlert = vi.fn().mockResolvedValue(undefined);
				const { loadFromDisk } = useFileOperations({ showAlert });

				await loadFromDisk();

				expect(showAlert).toHaveBeenCalledWith({
					title: "Load Error",
					message: "Failed to load file. Please try again.",
				});
			});
		});
	});

	describe("handleFileInputChange", () => {
		it("should do nothing if no file selected", async () => {
			const { handleFileInputChange } = useFileOperations();

			const event = {
				target: { files: [] },
			} as unknown as Event;

			await handleFileInputChange(event);

			// Store should remain unchanged
			expect(store.sets.length).toBe(1);
		});

		it("should load valid file from input", async () => {
			const validData = {
				metadata: { setListName: "Input Show" },
				sets: [{ name: "Set 1", songs: [{ title: "Input Song" }] }],
			};

			const mockFile = {
				text: vi.fn().mockResolvedValue(JSON.stringify(validData)),
			};

			const { handleFileInputChange } = useFileOperations();

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(store.metadata.setListName).toBe("Input Show");
			expect(store.sets[0].songs[0].title).toBe("Input Song");
		});

		it("should reset input value after loading", async () => {
			const validData = {
				sets: [{ name: "Set 1", songs: [] }],
			};

			const mockFile = {
				text: vi.fn().mockResolvedValue(JSON.stringify(validData)),
			};

			const { handleFileInputChange } = useFileOperations();

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(mockInput.value).toBe("");
		});

		it("should clear file handle when loading from input", async () => {
			const validData = {
				sets: [{ name: "Set 1", songs: [] }],
			};

			const mockFile = {
				text: vi.fn().mockResolvedValue(JSON.stringify(validData)),
			};

			const { handleFileInputChange, currentFileHandle } = useFileOperations();

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(currentFileHandle.value).toBe(null);
		});

		it("should show alert for invalid file", async () => {
			const invalidData = { invalid: true };

			const mockFile = {
				text: vi.fn().mockResolvedValue(JSON.stringify(invalidData)),
			};

			const showAlert = vi.fn().mockResolvedValue(undefined);
			const { handleFileInputChange } = useFileOperations({ showAlert });

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(showAlert).toHaveBeenCalledWith({
				title: "Invalid File",
				message: "The selected file is not a valid set list file.",
			});
		});

		it("should show alert for JSON parse error", async () => {
			const mockFile = {
				text: vi.fn().mockResolvedValue("not valid json"),
			};

			const showAlert = vi.fn().mockResolvedValue(undefined);
			const { handleFileInputChange } = useFileOperations({ showAlert });

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(showAlert).toHaveBeenCalledWith({
				title: "Load Error",
				message: "Failed to load file. Please try again.",
			});
		});

		it("should fall back to native alert if showAlert not provided", async () => {
			const invalidData = { invalid: true };

			const mockFile = {
				text: vi.fn().mockResolvedValue(JSON.stringify(invalidData)),
			};

			const { handleFileInputChange } = useFileOperations();

			const mockInput = { files: [mockFile], value: "test.json" };
			const event = { target: mockInput } as unknown as Event;

			await handleFileInputChange(event);

			expect(window.alert).toHaveBeenCalledWith("Invalid set list file.");
		});
	});

	describe("options callbacks", () => {
		it("should accept showConfirm callback", () => {
			const showConfirm = vi.fn();
			const ops = useFileOperations({ showConfirm });
			expect(ops).toBeDefined();
		});

		it("should accept showAlert callback", () => {
			const showAlert = vi.fn();
			const ops = useFileOperations({ showAlert });
			expect(ops).toBeDefined();
		});

		it("should accept both callbacks", () => {
			const showConfirm = vi.fn();
			const showAlert = vi.fn();
			const ops = useFileOperations({ showConfirm, showAlert });
			expect(ops).toBeDefined();
		});

		it("should work without callbacks (fallback to native)", async () => {
			(window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
			// Make the store dirty by changing metadata
			store.metadata.setListName = "Dirty Test";

			const { loadFromDisk } = useFileOperations();
			await loadFromDisk();

			expect(window.confirm).toHaveBeenCalled();
		});
	});
});
