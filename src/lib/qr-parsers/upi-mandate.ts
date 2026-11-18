/** `upi://<intent>?…` — captures the intent (`pay`, `mandate`, `collect`, …). */
const UPI_SCHEME_REGEX = /^upi:\/\/([^?/]*)/i;

/** The only UPI intent that is a one-off payment. */
const UPI_PAY_INTENT = "pay";

/**
 * Params that only appear on UPI AutoPay / mandate intents (NPCI recurring
 * debits). Lower-cased for case-insensitive matching.
 */
const UPI_MANDATE_PARAMS = [
  "recur",
  "amrule",
  "validitystart",
  "validityend",
  "txntype",
] as const;

/**
 * True when a scanned UPI payload is NOT a plain one-off `upi://pay` intent —
 * e.g. `upi://mandate?…` (AutoPay), which would register a standing debit on
 * the payer's account. Mirrors the SDK's `parseUPI` rule; kept app-side so an
 * older SDK build can't let one through.
 */
export function isUpiMandateQr(payload: string): boolean {
  const trimmed = payload.trim();
  const intent = UPI_SCHEME_REGEX.exec(trimmed)?.[1];
  if (intent !== undefined && intent.toLowerCase() !== UPI_PAY_INTENT) {
    return true;
  }

  const query = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
  const keys = new Set(
    [...new URLSearchParams(query).keys()].map((key) => key.toLowerCase()),
  );
  return UPI_MANDATE_PARAMS.some((param) => keys.has(param));
}
