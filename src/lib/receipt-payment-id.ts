import {
  formatStoredPaymentIdForDisplay,
  getCountryOption,
  resolveIndonesianStoredPaymentIdDisplay,
  unpackPackedPaymentId,
} from "@p2pdotme/sdk/country";
import { getDisplayQrPayload } from "@/lib/compound-payment-id";
import type { CurrencyType } from "@/lib/constants";

export type ReceiptPaymentIdDetails = {
  display: string;
  copyValue: string | null;
  qr: string | null;
};

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
  if (!currency) return { display: value, copyValue: value, qr: null };

  const code = currency as CurrencyType;
  // IDR-specific: `Provider|number` → display both, copy only the number.
  const idr = resolveIndonesianStoredPaymentIdDisplay(code, value);
  if (idr) return { display: idr.display, copyValue: idr.copyValue, qr: null };

  const qr = getDisplayQrPayload(code, value);
  const formatted = formatStoredPaymentIdForDisplay(code, value);
  if (formatted) {
    const { rest } = unpackPackedPaymentId(value);
    return {
      display: formatted,
      copyValue: rest.trim() || formatted,
      qr,
    };
  }

  if (qr) {
    const option = getCountryOption(code);
    return {
      display: option ? t(option.paymentAddressName) : "",
      copyValue: null,
      qr,
    };
  }

  return { display: value, copyValue: value, qr: null };
}
