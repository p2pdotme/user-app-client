import {
  assignStoredPaymentIdToFieldValues,
  formatStoredPaymentIdForDisplay,
  getCountryOption,
  resolveIndonesianStoredPaymentIdDisplay,
  unpackPackedPaymentId,
} from "@p2pdotme/sdk/country";
import { getDisplayQrPayload } from "@/lib/compound-payment-id";
import { type CurrencyType, PAYMENT_ID_FIELDS } from "@/lib/constants";

export type ReceiptPaymentIdDetails = {
  display: string;
  copyValue: string | null;
  qr: string | null;
};

function filledFieldValues(currency: CurrencyType, value: string): string {
  const values = assignStoredPaymentIdToFieldValues(currency, value);
  return (PAYMENT_ID_FIELDS[currency] ?? [])
    .map((field) => (values[field.key] || "").trim())
    .filter((part) => part.length > 0)
    .join(" | ");
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
  if (!currency) return { display: value, copyValue: value, qr: null };

  const code = currency as CurrencyType;
  // IDR-specific: `Provider|number` → display both, copy only the number.
  const idr = resolveIndonesianStoredPaymentIdDisplay(code, value);
  if (idr) return { display: idr.display, copyValue: idr.copyValue, qr: null };

  const qr = getDisplayQrPayload(code, value);
  const formatted = formatStoredPaymentIdForDisplay(code, value);
  if (formatted) {
    // Without a QR, `||` may just be adjacent empty fields (KES `phone|||`),
    // so copy the filled values rather than the raw packed rest.
    const rest = qr
      ? unpackPackedPaymentId(value).rest.trim()
      : filledFieldValues(code, value);
    return {
      display: formatted,
      copyValue: rest || formatted,
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
