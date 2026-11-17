/**
 * Remembers the payment ID used for the most recent SELL order placement on
 * this device, per wallet. Per-order details live in
 * `addLocalOrderPaymentDetails`, but that needs the order ID — if the order ID
 * can't be read from the receipt we still want the ACCEPTED screen to be able
 * to prefill what the user typed.
 *
 * Keyed by account address so another wallet on the same device never sees
 * it, and cleared on logout (`clearLastSellPaymentDetails`).
 *
 * This is only ever used as a prefill the user confirms; it is never sent
 * automatically.
 */
const STORAGE_KEY_PREFIX = "sell:last-payment-details";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type LastSellPaymentDetails = {
  paymentId: string;
  currency: string;
  savedAt: number;
};

const storageKey = (account: string) =>
  `${STORAGE_KEY_PREFIX}:${account.toLowerCase()}`;

export function saveLastSellPaymentDetails(
  account: string | undefined,
  paymentId: string,
  currency: string,
) {
  if (!account) return;
  try {
    const value: LastSellPaymentDetails = {
      paymentId,
      currency,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey(account), JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, quota); the inline form still works.
  }
}

export function getLastSellPaymentDetails(
  account: string | undefined,
  currency: string,
): string | undefined {
  if (!account) return undefined;
  try {
    const raw = localStorage.getItem(storageKey(account));
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

/** Removes every wallet's entry (and the legacy device-wide one) on logout. */
export function clearLastSellPaymentDetails() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
