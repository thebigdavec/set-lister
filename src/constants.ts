// =============================================================================
// Page Dimensions (A4)
// =============================================================================

/** Conversion factor: 1 cm ≈ 37.795 px */
export const CM_TO_PX = 37.795275591;

/** A4 page height in centimeters */
export const TARGET_HEIGHT_CM = 29.7;

/** A4 page width in centimeters */
export const TARGET_WIDTH_CM = 21.0;

// =============================================================================
// Page Margins
// =============================================================================

/** Page margins in centimeters */
export const MARGINS_CM = {
	top: 1,
	bottom: 1,
	left: 1,
	right: 1,
} as const;

// =============================================================================
// Computed Dimensions
// =============================================================================

/** Available box height in centimeters (page height minus top/bottom margins) */
export const BOX_HEIGHT_CM =
	TARGET_HEIGHT_CM - MARGINS_CM.top - MARGINS_CM.bottom;

/** Available box width in centimeters (page width minus left/right margins) */
export const BOX_WIDTH_CM =
	TARGET_WIDTH_CM - MARGINS_CM.left - MARGINS_CM.right;

/** A4 page width in pixels */
export const TARGET_WIDTH_PX = TARGET_WIDTH_CM * CM_TO_PX;

/** A4 page height in pixels */
export const TARGET_HEIGHT_PX = TARGET_HEIGHT_CM * CM_TO_PX;

// =============================================================================
// Font Settings
// =============================================================================

/** Base font size in pixels for text measurement and scaling calculations */
export const BASE_FONT_SIZE_PX = 16;

/** Minimum font size in pixels to maintain readability */
export const MIN_FONT_SIZE_PX = 10;

/** Minimum line height multiplier */
export const MIN_LINE_HEIGHT = 1.0;

/** Maximum line height multiplier */
export const MAX_LINE_HEIGHT = 1.8;

/** Default font family stack used throughout the application */
export const DEFAULT_FONT_FAMILY =
	"Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";

// =============================================================================
// Storage Keys
// =============================================================================

/** Local storage keys for persisting application state */
export const STORAGE_KEYS = {
	/** Key for storing the main set list data */
	DATA: "set-lister-data",
	/** Key for storing the uppercase preview preference */
	PREVIEW_UPPERCASE: "set-lister-preview-uppercase",
	/** Key for storing dismissed hints (first-time user tips) */
	DISMISSED_HINTS: "set-lister-dismissed-hints",
	/** Key for storing song numbering preference in editor */
	EDITOR_NUMBERING: "set-lister-editor-numbering",
	/** Key for storing song numbering preference in preview */
	PREVIEW_NUMBERING: "set-lister-preview-numbering",
} as const;
