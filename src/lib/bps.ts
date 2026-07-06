// Basis-point (bps) helpers. 1 bps = 0.01%, so 100 bps = 1% and 10000 bps = 100%.

/** Largest slippage we allow the user to set: 5000 bps (50%). */
export const MAX_BPS = 5000;

/**
 * Formats a basis-point value as a human-readable percent string.
 *
 * @param bps Amount in basis points (e.g. 150).
 * @returns The value as a percent string (e.g. "1.5%").
 */
export function formatPercent(bps: number): string {
  return `${(bps / 100).toString()}%`;
}

/**
 * Parses a human-entered percent into basis points.
 *
 * @param value Percent string as typed by the user (e.g. "1.5"). Whitespace is
 *              trimmed; the fractional percent is rounded to the nearest bps.
 * @returns The value in basis points, or `null` when the input is not a
 *          positive number or exceeds {@link MAX_BPS}.
 */
export function percentToBps(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const bps = Math.round(parsed * 100);
  return bps > MAX_BPS ? null : bps;
}
