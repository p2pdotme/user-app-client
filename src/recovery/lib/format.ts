/** Decimals shown for a token balance; the exact value is kept for Max. */
const DISPLAY_DECIMALS = 6;

/**
 * Shortens a decimal string for display by cutting (never rounding up) extra
 * decimals: a balance must not look larger than it is. String-only, so large
 * 18-decimal balances keep their exact leading digits.
 */
export function formatBalanceForDisplay(
  formatted: string,
  maxDecimals: number = DISPLAY_DECIMALS,
): string {
  const [whole, fraction = ""] = formatted.split(".");
  const cut = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  if (cut) return `${whole}.${cut}`;
  // Non-zero dust below the display precision should not read as "0"
  const isDust = whole === "0" && /[1-9]/.test(fraction);
  return isDust ? `<0.${"0".repeat(maxDecimals - 1)}1` : whole;
}

const ERROR_DETAIL_MAX_LENGTH = 160;

/** Trims a raw error message to something a toast can show. */
export function toErrorDetail(message: string): string {
  const firstLine = message.split("\n")[0].trim();
  return firstLine.length > ERROR_DETAIL_MAX_LENGTH
    ? `${firstLine.slice(0, ERROR_DETAIL_MAX_LENGTH)}…`
    : firstLine;
}
