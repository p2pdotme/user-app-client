/**
 * Remembers the payment ID used for the most recent SELL order placement on
 * this device. Per-order details live in `addLocalOrderPaymentDetails`, but
 * that needs the order ID — if the order ID can't be read from the receipt we
 * still want the ACCEPTED screen to be able to prefill what the user typed.
 *
 * This is only ever used as a prefill the user confirms; it is never sent
 * automatically.
 */
const STORAGE_KEY = "sell:last-payment-details";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type LastSellPaymentDetails = {
  paymentId: string;
  currency: string;
  savedAt: number;
};

export function saveLastSellPaymentDetails(
  paymentId: string,
  currency: string,
) {
  try {
    const value: LastSellPaymentDetails = {
      paymentId,
      currency,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, quota); the inline form still works.
  }
}

export function getLastSellPaymentDetails(
  currency: string,
): string | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<LastSellPaymentDetails>;
    if (
      typeof parsed.paymentId !== "string" ||
      parsed.currency !== currency ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > MAX_AGE_MS
    ) {
      return undefined;
    }
    return parsed.paymentId;
  } catch {
    return undefined;
  }
}
