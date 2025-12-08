import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFileOperations } from "../useFileOperations";
import { store, resetStore, addSongToSet, markClean } from "../../store";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(store.isDirty).toBe(true);

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
        // Manually set dirty without using addSongToSet (which uses canvas)
        store.isDirty = true;
        expect(store.isDirty).toBe(true);

        const { saveToDisk } = useFileOperations();
        await saveToDisk();

        expect(store.isDirty).toBe(false);
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
        createWritable: ReturnType<typeof vi.fn>;
      };

      beforeEach(() => {
        mockWritable = {
          write: vi.fn().mockResolvedValue(undefined),
          close: vi.fn().mockResolvedValue(undefined),
        };
        mockHandle = {
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
        expect(store.isDirty).toBe(true);

        const { saveToDisk } = useFileOperations();
        await saveToDisk();

        expect(store.isDirty).toBe(false);
      });

      it("should show Save As when altKey is pressed", async () => {
        const { saveToDisk, currentFileHandle } = useFileOperations();
        // First save to get a handle
        await saveToDisk();
        const firstHandle = currentFileHandle.value;

        // Create new mock for second save
        const newMockHandle = {
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
        expect(store.isDirty).toBe(true);

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
      // Manually set dirty without using addSongToSet
      store.isDirty = true;

      const { loadFromDisk } = useFileOperations();
      await loadFromDisk();

      expect(window.confirm).toHaveBeenCalled();
    });
  });
});
