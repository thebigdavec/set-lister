import { ref } from "vue";

// Global state - shared across all tooltip instances
// This is intentionally module-level to persist across component instances
const tooltipHasBeenSeen = ref(false);
let resetTimeout: ReturnType<typeof setTimeout> | null = null;

// Constants for tooltip timing
const INITIAL_SHOW_DELAY = 800; // ms - delay before first tooltip appears
const SUBSEQUENT_SHOW_DELAY = 250; // ms - delay after a tooltip has been seen
const RESET_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms

/**
 * Composable for managing global tooltip state.
 *
 * Once any tooltip has been shown, subsequent tooltips will appear faster.
 * The "seen" state resets after 10 minutes of inactivity.
 * State does not persist across page refreshes.
 */
export function useTooltipState() {
	/**
	 * Mark that a tooltip has been shown.
	 * This will cause subsequent tooltips to use the shorter delay.
	 * Resets the 10-minute timeout.
	 */
	function markTooltipSeen(): void {
		tooltipHasBeenSeen.value = true;
		resetInactivityTimer();
	}

	/**
	 * Reset the inactivity timer.
	 * Called whenever a tooltip is shown to extend the "fast tooltip" period.
	 */
	function resetInactivityTimer(): void {
		if (resetTimeout) {
			clearTimeout(resetTimeout);
		}
		resetTimeout = setTimeout(() => {
			tooltipHasBeenSeen.value = false;
			resetTimeout = null;
		}, RESET_TIMEOUT);
	}

	/**
	 * Get the appropriate show delay based on whether a tooltip has been seen.
	 */
	function getShowDelay(): number {
		return tooltipHasBeenSeen.value
			? SUBSEQUENT_SHOW_DELAY
			: INITIAL_SHOW_DELAY;
	}

	/**
	 * Check if any tooltip has been seen in the current session.
	 */
	function hasBeenSeen(): boolean {
		return tooltipHasBeenSeen.value;
	}

	/**
	 * Reset the tooltip state. For testing purposes only.
	 * @internal
	 */
	function _reset(): void {
		tooltipHasBeenSeen.value = false;
		if (resetTimeout) {
			clearTimeout(resetTimeout);
			resetTimeout = null;
		}
	}

	return {
		markTooltipSeen,
		getShowDelay,
		hasBeenSeen,
		// Expose constants for components that want to override behavior
		INITIAL_SHOW_DELAY,
		SUBSEQUENT_SHOW_DELAY,
		RESET_TIMEOUT,
		// For testing only
		_reset,
	};
}

export type UseTooltipStateReturn = ReturnType<typeof useTooltipState>;
