/**
 * TypeScript declarations for the File System Access API
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 *
 * These APIs are not yet part of the standard TypeScript DOM lib,
 * so we declare them here for type safety.
 */

/**
 * A writable stream for writing to a file.
 */
interface FileSystemWritableFileStream extends WritableStream {
	/**
	 * Writes content to the file at the current position.
	 */
	write(data: string | BufferSource | Blob | WriteParams): Promise<void>;

	/**
	 * Moves the current file cursor to the specified position.
	 */
	seek(position: number): Promise<void>;

	/**
	 * Resizes the file to the specified size.
	 */
	truncate(size: number): Promise<void>;
}

interface WriteParams {
	type: "write" | "seek" | "truncate";
	data?: string | BufferSource | Blob;
	position?: number;
	size?: number;
}

interface FileSystemCreateWritableOptions {
	keepExistingData?: boolean;
}

/**
 * Options for querying or requesting permission on a file handle.
 */
interface FileSystemHandlePermissionDescriptor {
	mode?: "read" | "readwrite";
}

interface FileSystemGetFileOptions {
	create?: boolean;
}

interface FileSystemGetDirectoryOptions {
	create?: boolean;
}

interface FileSystemRemoveOptions {
	recursive?: boolean;
}

/**
 * Options for file picker accept types.
 */
interface FilePickerAcceptType {
	/**
	 * A description of the file type (e.g., "JSON Files").
	 */
	description?: string;

	/**
	 * A record mapping MIME types to file extensions.
	 * @example { "application/json": [".json"] }
	 */
	accept: Record<string, string | string[]>;
}

/**
 * Options for the save file picker.
 */
interface SaveFilePickerOptions {
	/**
	 * Suggested name for the file.
	 */
	suggestedName?: string;

	/**
	 * An array of allowed file types.
	 */
	types?: FilePickerAcceptType[];

	/**
	 * If true, the picker will not include an option to accept all file types.
	 */
	excludeAcceptAllOption?: boolean;

	/**
	 * The ID to use for the picker's starting directory.
	 */
	id?: string;

	/**
	 * A well-known directory or FileSystemHandle to start in.
	 */
	startIn?: WellKnownDirectory | FileSystemHandle;
}

/**
 * Options for the open file picker.
 */
interface OpenFilePickerOptions {
	/**
	 * If true, allows multiple files to be selected.
	 */
	multiple?: boolean;

	/**
	 * An array of allowed file types.
	 */
	types?: FilePickerAcceptType[];

	/**
	 * If true, the picker will not include an option to accept all file types.
	 */
	excludeAcceptAllOption?: boolean;

	/**
	 * The ID to use for the picker's starting directory.
	 */
	id?: string;

	/**
	 * A well-known directory or FileSystemHandle to start in.
	 */
	startIn?: WellKnownDirectory | FileSystemHandle;
}

/**
 * Options for the directory picker.
 */
interface DirectoryPickerOptions {
	/**
	 * The ID to use for the picker's starting directory.
	 */
	id?: string;

	/**
	 * A well-known directory or FileSystemHandle to start in.
	 */
	startIn?: WellKnownDirectory | FileSystemHandle;

	/**
	 * The mode to open the directory in.
	 */
	mode?: "read" | "readwrite";
}

/**
 * Well-known directory identifiers for file pickers.
 */
type WellKnownDirectory =
	| "desktop"
	| "documents"
	| "downloads"
	| "music"
	| "pictures"
	| "videos";

/**
 * Extend the Window interface to include File System Access API methods.
 */
declare global {
	/**
	 * A handle for a file system entry (base interface).
	 */
	interface FileSystemHandle {
		readonly kind: "file" | "directory";
		readonly name: string;
		isSameEntry(other: FileSystemHandle): Promise<boolean>;
	}

	/**
	 * A handle representing a file entry in the file system.
	 */
	interface FileSystemFileHandle extends FileSystemHandle {
		readonly kind: "file";

		/**
		 * Returns a File object representing the file.
		 */
		getFile(): Promise<File>;

		/**
		 * Creates a writable stream for writing to the file.
		 */
		createWritable(
			options?: FileSystemCreateWritableOptions,
		): Promise<FileSystemWritableFileStream>;

		/**
		 * Queries the current permission state of the handle.
		 * Returns "granted", "denied", or "prompt".
		 */
		queryPermission(
			descriptor?: FileSystemHandlePermissionDescriptor,
		): Promise<PermissionState>;

		/**
		 * Requests permission for the handle.
		 * Returns "granted", "denied", or "prompt".
		 * Note: This typically requires a user gesture (click, etc.) to succeed.
		 */
		requestPermission(
			descriptor?: FileSystemHandlePermissionDescriptor,
		): Promise<PermissionState>;
	}

	/**
	 * A handle representing a directory entry in the file system.
	 */
	interface FileSystemDirectoryHandle extends FileSystemHandle {
		readonly kind: "directory";

		getFileHandle(
			name: string,
			options?: FileSystemGetFileOptions,
		): Promise<FileSystemFileHandle>;
		getDirectoryHandle(
			name: string,
			options?: FileSystemGetDirectoryOptions,
		): Promise<FileSystemDirectoryHandle>;
		removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
		resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
	}

	interface Window {
		/**
		 * Shows a file picker that allows the user to save a file.
		 * Returns a FileSystemFileHandle for the selected file.
		 */
		showSaveFilePicker?(
			options?: SaveFilePickerOptions,
		): Promise<FileSystemFileHandle>;

		/**
		 * Shows a file picker that allows the user to select one or more files.
		 * Returns an array of FileSystemFileHandle objects.
		 */
		showOpenFilePicker?(
			options?: OpenFilePickerOptions,
		): Promise<FileSystemFileHandle[]>;

		/**
		 * Shows a directory picker that allows the user to select a directory.
		 * Returns a FileSystemDirectoryHandle for the selected directory.
		 */
		showDirectoryPicker?(
			options?: DirectoryPickerOptions,
		): Promise<FileSystemDirectoryHandle>;
	}
}

export {};
