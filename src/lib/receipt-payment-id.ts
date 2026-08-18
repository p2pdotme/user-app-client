import {
  COUNTRY_OPTIONS,
  formatStoredPaymentIdForDisplay,
  unpackPackedPaymentId,
  usesPackedPaymentId,
} from "@p2pdotme/sdk/country";
import type { CurrencyType } from "@/lib/constants";

/**
 * Human-readable payment ID for receipts. Packed QRs never dump the raw
 * payload; copy uses typed fields when available.
 */
export function formatReceiptPaymentId(
  value: string | null | undefined,
  currency: string | null | undefined,
  labels: { peruQr: string; venQr: string },
): { display: string; copyValue: string | null } {
  if (!value) return { display: "", copyValue: null };
  if (!currency) return { display: value, copyValue: value };

  const code = currency as CurrencyType;
  const formatted = formatStoredPaymentIdForDisplay(code, value);
  if (formatted) {
    const { rest } = unpackPackedPaymentId(value);
    return { display: formatted, copyValue: rest.trim() || formatted };
  }

  if (usesPackedPaymentId(code)) {
    const { qr } = unpackPackedPaymentId(value);
    const option = COUNTRY_OPTIONS.find((c) => c.currency === code);
    if (qr || option?.validateQr?.(value.trim())) {
      const qrLabel = code === "PEN" ? labels.peruQr : labels.venQr;
      return { display: qrLabel, copyValue: null };
    }
  }

  return { display: value, copyValue: value };
}
