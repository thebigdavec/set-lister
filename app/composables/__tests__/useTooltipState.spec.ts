import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useTooltipState } from "../useTooltipState";

describe("useTooltipState", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Reset the global state before each test
		const { _reset } = useTooltipState();
		_reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("initial state", () => {
		it("should not have seen any tooltips initially", () => {
			const { hasBeenSeen } = useTooltipState();
			expect(hasBeenSeen()).toBe(false);
		});

		it("should return initial show delay when no tooltip has been seen", () => {
			const { getShowDelay, INITIAL_SHOW_DELAY } = useTooltipState();
			expect(getShowDelay()).toBe(INITIAL_SHOW_DELAY);
		});
	});

	describe("markTooltipSeen", () => {
		it("should mark tooltip as seen", () => {
			const { markTooltipSeen, hasBeenSeen } = useTooltipState();
			expect(hasBeenSeen()).toBe(false);
			markTooltipSeen();
			expect(hasBeenSeen()).toBe(true);
		});

		it("should return subsequent show delay after tooltip has been seen", () => {
			const { markTooltipSeen, getShowDelay, SUBSEQUENT_SHOW_DELAY } =
				useTooltipState();
			markTooltipSeen();
			expect(getShowDelay()).toBe(SUBSEQUENT_SHOW_DELAY);
		});
	});

	describe("reset timeout", () => {
		it("should reset seen state after 10 minutes of inactivity", () => {
			const { markTooltipSeen, hasBeenSeen, RESET_TIMEOUT } = useTooltipState();

			markTooltipSeen();
			expect(hasBeenSeen()).toBe(true);

			// Advance time by just under 10 minutes
			vi.advanceTimersByTime(RESET_TIMEOUT - 1000);
			expect(hasBeenSeen()).toBe(true);

			// Advance past the 10 minute mark
			vi.advanceTimersByTime(2000);
			expect(hasBeenSeen()).toBe(false);
		});

		it("should return initial delay after reset timeout", () => {
			const {
				markTooltipSeen,
				getShowDelay,
				RESET_TIMEOUT,
				INITIAL_SHOW_DELAY,
			} = useTooltipState();

			markTooltipSeen();

			vi.advanceTimersByTime(RESET_TIMEOUT + 1000);
			expect(getShowDelay()).toBe(INITIAL_SHOW_DELAY);
		});

		it("should reset the timeout when a new tooltip is seen", () => {
			const { markTooltipSeen, hasBeenSeen, RESET_TIMEOUT } = useTooltipState();

			markTooltipSeen();

			// Advance time by 5 minutes
			vi.advanceTimersByTime(5 * 60 * 1000);
			expect(hasBeenSeen()).toBe(true);

			// See another tooltip, which should reset the timer
			markTooltipSeen();

			// Advance by another 5 minutes (total 10 minutes from first, but only 5 from second)
			vi.advanceTimersByTime(5 * 60 * 1000);
			expect(hasBeenSeen()).toBe(true);

			// Advance to 10 minutes from the second tooltip
			vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
			expect(hasBeenSeen()).toBe(false);
		});
	});

	describe("constants", () => {
		it("should expose INITIAL_SHOW_DELAY constant as 800ms", () => {
			const { INITIAL_SHOW_DELAY } = useTooltipState();
			expect(INITIAL_SHOW_DELAY).toBe(800);
		});

		it("should expose SUBSEQUENT_SHOW_DELAY constant as 250ms", () => {
			const { SUBSEQUENT_SHOW_DELAY } = useTooltipState();
			expect(SUBSEQUENT_SHOW_DELAY).toBe(250);
		});

		it("should expose RESET_TIMEOUT constant as 10 minutes in ms", () => {
			const { RESET_TIMEOUT } = useTooltipState();
			expect(RESET_TIMEOUT).toBe(10 * 60 * 1000);
		});
	});

	describe("shared state across instances", () => {
		it("should share state between multiple useTooltipState calls", () => {
			const instance1 = useTooltipState();
			const instance2 = useTooltipState();

			expect(instance1.hasBeenSeen()).toBe(false);
			expect(instance2.hasBeenSeen()).toBe(false);

			instance1.markTooltipSeen();

			expect(instance1.hasBeenSeen()).toBe(true);
			expect(instance2.hasBeenSeen()).toBe(true);
		});

		it("should return same delay from different instances", () => {
			const instance1 = useTooltipState();
			const instance2 = useTooltipState();

			instance1.markTooltipSeen();

			expect(instance1.getShowDelay()).toBe(instance2.getShowDelay());
			expect(instance1.getShowDelay()).toBe(instance1.SUBSEQUENT_SHOW_DELAY);
		});
	});

	describe("delay values", () => {
		it("should have initial delay longer than subsequent delay", () => {
			const { INITIAL_SHOW_DELAY, SUBSEQUENT_SHOW_DELAY } = useTooltipState();
			expect(INITIAL_SHOW_DELAY).toBeGreaterThan(SUBSEQUENT_SHOW_DELAY);
		});

		it("should switch from initial to subsequent delay after first tooltip", () => {
			const {
				markTooltipSeen,
				getShowDelay,
				INITIAL_SHOW_DELAY,
				SUBSEQUENT_SHOW_DELAY,
			} = useTooltipState();

			expect(getShowDelay()).toBe(INITIAL_SHOW_DELAY);
			markTooltipSeen();
			expect(getShowDelay()).toBe(SUBSEQUENT_SHOW_DELAY);
		});
	});
});
