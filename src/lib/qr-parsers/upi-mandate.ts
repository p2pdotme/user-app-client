/** UPI AutoPay mandate intent: `upi://mandate?…` (case-insensitive). */
const UPI_MANDATE_INTENT_REGEX = /^upi:\/\/mandate(?:[?/]|$)/i;

/**
 * Params that only appear on UPI AutoPay / mandate intents (NPCI recurring
 * debits). Lower-cased for case-insensitive matching.
 */
const UPI_MANDATE_PARAMS = [
  "recur",
  "amrule",
  "validitystart",
  "validityend",
] as const;

/**
 * True when a scanned UPI payload is an AutoPay mandate — `upi://mandate?…` or
 * a QR carrying mandate-only params — which would register a standing debit on
 * the payer's account. Mirrors the SDK's `parseUPI` rule; kept app-side so an
 * older SDK build can't let one through.
 */
export function isUpiMandateQr(payload: string): boolean {
  const trimmed = payload.trim();
  if (UPI_MANDATE_INTENT_REGEX.test(trimmed)) return true;

  const query = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
  const keys = new Set(
    [...new URLSearchParams(query).keys()].map((key) => key.toLowerCase()),
  );
  return UPI_MANDATE_PARAMS.some((param) => keys.has(param));
}
