import {
  formatStoredPaymentIdForDisplay,
  getCountryOption,
  unpackPackedPaymentId,
} from "@p2pdotme/sdk/country";
import { getDisplayQrPayload } from "@/lib/compound-payment-id";
import type { CurrencyType } from "@/lib/constants";

export type ReceiptPaymentIdDetails = {
  display: string;
  copyValue: string | null;
  qr: string | null;
};

/** India UPI PAY intent. Do not treat EMVCo `000201` here — ARS/BRL/IDR
 * still dump that blob as text until they get `getPayQrPayload`. */
function looksLikeUpiPayIntent(value: string): boolean {
  return /^upi:\/\//i.test(value.trim());
}

function upiPaFromIntent(intent: string): string {
  const trimmed = intent.trim();
  const query = /^upi:\/\/pay\?/i.test(trimmed)
    ? trimmed.replace(/^upi:\/\/pay\?/i, "")
    : trimmed.includes("?")
      ? (trimmed.split("?")[1] ?? "")
      : "";
  if (!query) return "";
  return new URLSearchParams(query).get("pa")?.trim() ?? "";
}

/**
 * Human-readable payment ID for receipts. Packed QRs never dump the raw
 * payload; `qr` holds the scannable value when present.
 */
export function formatReceiptPaymentId(
  value: string | null | undefined,
  currency: string | null | undefined,
  t: (key: string) => string,
): ReceiptPaymentIdDetails {
  if (!value) return { display: "", copyValue: null, qr: null };
  if (!currency) {
    if (looksLikeUpiPayIntent(value)) {
      const pa = upiPaFromIntent(value);
      return { display: pa, copyValue: pa || null, qr: value.trim() };
    }
    return { display: value, copyValue: value, qr: null };
  }

  const code = currency as CurrencyType;
  const qr =
    getDisplayQrPayload(code, value) ??
    (looksLikeUpiPayIntent(value) ? value.trim() : null);
  const formatted = formatStoredPaymentIdForDisplay(code, value);
  if (qr) {
    const option = getCountryOption(code);
    const short =
      formatted &&
      formatted !== value.trim() &&
      !looksLikeUpiPayIntent(formatted)
        ? formatted
        : upiPaFromIntent(qr);
    return {
      display: short || (option ? t(option.paymentAddressName) : ""),
      copyValue: short || null,
      qr,
    };
  }

  if (formatted && !looksLikeUpiPayIntent(formatted)) {
    const { rest } = unpackPackedPaymentId(value);
    return {
      display: formatted,
      copyValue: rest.trim() || formatted,
      qr: null,
    };
  }

  return { display: value, copyValue: value, qr: null };
}
