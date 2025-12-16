/**
 * Safe localStorage operations with error handling
 */

export interface StorageError {
  type: "quota_exceeded" | "not_available" | "unknown";
  message: string;
  originalError?: unknown;
}

/**
 * Safely set an item in localStorage.
 * Returns true on success, false on failure.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    const storageError = categorizeStorageError(error);
    console.error(`localStorage.setItem failed for key "${key}":`, storageError);

    // In a production app, you might want to:
    // - Show a user notification
    // - Send to error tracking service
    // - Attempt to clear old data

    return false;
  }
}

/**
 * Safely get an item from localStorage.
 * Returns null if the item doesn't exist or if there's an error.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    const storageError = categorizeStorageError(error);
    console.error(`localStorage.getItem failed for key "${key}":`, storageError);
    return null;
  }
}

/**
 * Safely remove an item from localStorage.
 * Returns true on success, false on failure.
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    const storageError = categorizeStorageError(error);
    console.error(
      `localStorage.removeItem failed for key "${key}":`,
      storageError,
    );
    return false;
  }
}

/**
 * Categorize storage errors for better error handling
 */
function categorizeStorageError(error: unknown): StorageError {
  if (error instanceof DOMException) {
    // QuotaExceededError
    if (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    ) {
      return {
        type: "quota_exceeded",
        message: "localStorage quota exceeded",
        originalError: error,
      };
    }

    // SecurityError (localStorage not available)
    if (error.name === "SecurityError") {
      return {
        type: "not_available",
        message: "localStorage is not available (possibly in private mode)",
        originalError: error,
      };
    }
  }

  return {
    type: "unknown",
    message: "Unknown localStorage error",
    originalError: error,
  };
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__localStorage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the approximate size of localStorage usage in bytes
 */
export function getLocalStorageSize(): number {
  let total = 0;
  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const value = localStorage.getItem(key);
        if (value) {
          // Approximate: key length + value length * 2 (UTF-16)
          total += (key.length + value.length) * 2;
        }
      }
    }
  } catch {
    return 0;
  }
  return total;
}

