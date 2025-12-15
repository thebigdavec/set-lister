import { computed, nextTick, type Ref } from "vue";
import { fitStringsToBox } from "../utils/fitStringsToBox";
import { formatSongLabel } from "../utils/textMetrics";
import {
	BOX_HEIGHT_CM,
	BOX_WIDTH_CM,
	CM_TO_PX,
	TARGET_HEIGHT_PX,
	TARGET_WIDTH_PX,
} from "../constants";
import type { SetItem } from "../store";

/**
 * Options for usePreviewScaling
 */
export interface PreviewScalingOptions {
	/** Ref to the preview container element */
	previewRef: Ref<HTMLDivElement | null>;
	/** Ref indicating if preview mode is active */
	showPreview: Ref<boolean>;
	/** Ref indicating if titles should be uppercase */
	uppercasePreview: Ref<boolean>;
	/** Ref indicating if song numbers should be shown */
	showNumbers: Ref<boolean>;
	/** Computed ref of sets to preview (filtered to non-empty) */
	previewSets: Ref<SetItem[]>;
}

/**
 * Composable for preview sizing and scaling logic.
 * Handles responsive scaling of the print preview and font sizing.
 */
export function usePreviewScaling(
	previewScale: Ref<number>,
	options: PreviewScalingOptions,
) {
	const {
		previewRef,
		showPreview,
		uppercasePreview,
		showNumbers,
		previewSets,
	} = options;

	/**
	 * Computed style for the preview sheet (A4 dimensions)
	 */
	const previewSheetStyle = computed(() => ({
		width: `${TARGET_WIDTH_PX}px`,
		minHeight: `${TARGET_HEIGHT_PX}px`,
	}));

	/**
	 * Computed style for the preview wrapper with scaling transform
	 */
	const previewWrapperStyle = computed(() => ({
		transform: `scale(${previewScale.value})`,
		transformOrigin: "top center",
		height: `${TARGET_HEIGHT_PX * previewScale.value}px`,
	}));

	/**
	 * Update the preview scale based on available container width
	 */
	function updatePreviewScale(): void {
		if (!showPreview.value || !previewRef.value) {
			previewScale.value = 1;
			return;
		}

		const container = previewRef.value;
		const styles = window.getComputedStyle(container);
		const paddingLeft = parseFloat(styles.paddingLeft || "0");
		const paddingRight = parseFloat(styles.paddingRight || "0");
		const availableWidth = container.clientWidth - paddingLeft - paddingRight;

		if (availableWidth <= 0) {
			previewScale.value = 1;
			return;
		}

		const scale = Math.min(1, availableWidth / TARGET_WIDTH_PX);
		previewScale.value = Number.isFinite(scale) && scale > 0 ? scale : 1;
	}

	/**
	 * Handle window resize events
	 */
	function handlePreviewResize(): void {
		if (!showPreview.value) return;
		updatePreviewScale();
	}

	/**
	 * Apply font sizing to all sets in the preview.
	 * Calculates optimal font size and line height to fit songs within the available space.
	 */
	async function applyPreviewSizing(): Promise<void> {
		if (!showPreview.value) return;
		await nextTick();
		if (!previewRef.value) return;

		for (const set of previewSets.value) {
			const setSelector = `.preview-set[data-set-id="${set.id}"]`;
			const setEl = previewRef.value.querySelector<HTMLElement>(setSelector);
			if (!setEl) continue;

			const songsEl = setEl.querySelector<HTMLElement>(".song-list");
			if (!songsEl) continue;

			// Filter out encore markers for string measurement
			const playableSongs = set.songs.filter(
				(song) => !song.isEncoreMarker && song.title !== "<encore>",
			);

			// When numbers are shown, we need to account for the number prefix width.
			// Numbers are displayed at 50% font size, so we add equivalent space.
			// The longest number determines the prefix width (e.g., "99" for 99 songs).
			// At 50% size, the effective width is halved, plus a small gap.
			const maxNumber = playableSongs.length;
			const numberPrefix = showNumbers.value
				? `${maxNumber}`.replace(/./g, "0") + " " // Use zeros for consistent width measurement
				: "";

			const strings = playableSongs.map((song) => {
				const title = uppercasePreview.value
					? song.title.toUpperCase()
					: song.title;
				const label = formatSongLabel(title, song.key);
				// Add half-width prefix to simulate the space taken by the number at 50% font size
				// We use half the characters since the number is at 50% size
				return showNumbers.value
					? numberPrefix.slice(0, Math.ceil(numberPrefix.length / 2)) + label
					: label;
			});

			if (strings.length === 0) {
				songsEl.style.fontSize = "";
				songsEl.style.lineHeight = "";
				continue;
			}

			// Measure the header height to subtract from available space
			// Use getBoundingClientRect and compute margin to get full height including margin-bottom
			const headerEl = setEl.querySelector<HTMLElement>(".metadata-header");
			let headerHeightPx = 0;
			if (headerEl) {
				const headerRect = headerEl.getBoundingClientRect();
				const headerStyles = window.getComputedStyle(headerEl);
				const marginBottom = parseFloat(headerStyles.marginBottom) || 0;
				headerHeightPx = headerRect.height + marginBottom;
			}

			// Account for the .set-spacer element (min-height: 1em, roughly 16px)
			const spacerHeightPx = 16;

			// Convert to cm and subtract from available height
			const usedHeightCm = (headerHeightPx + spacerHeightPx) / CM_TO_PX;
			const availableHeightCm = BOX_HEIGHT_CM - usedHeightCm;

			const { fontSizePx, lineHeight } = fitStringsToBox(
				strings,
				BOX_WIDTH_CM,
				availableHeightCm,
			);
			songsEl.style.fontSize = `${fontSizePx}px`;
			songsEl.style.lineHeight = lineHeight.toString();
		}
	}

	/**
	 * Toggle preview on and apply sizing
	 */
	async function openPreview(): Promise<void> {
		await applyPreviewSizing();
		updatePreviewScale();
	}

	/**
	 * Print the current preview
	 */
	function printSets(): void {
		window.print();
	}

	return {
		previewSheetStyle,
		previewWrapperStyle,
		updatePreviewScale,
		handlePreviewResize,
		applyPreviewSizing,
		openPreview,
		printSets,
	};
}
