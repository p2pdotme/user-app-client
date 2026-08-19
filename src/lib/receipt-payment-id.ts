import {
  formatStoredPaymentIdForDisplay,
  getCountryOption,
  getStoredQrPayload,
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
  t: (key: string) => string,
): { display: string; copyValue: string | null } {
  if (!value) return { display: "", copyValue: null };
  if (!currency) return { display: value, copyValue: value };

  const code = currency as CurrencyType;
  const formatted = formatStoredPaymentIdForDisplay(code, value);
  if (formatted) {
    const { rest } = unpackPackedPaymentId(value);
    return { display: formatted, copyValue: rest.trim() || formatted };
  }

  if (usesPackedPaymentId(code) && getStoredQrPayload(code, value)) {
    const option = getCountryOption(code);
    return {
      display: option ? t(option.paymentAddressName) : "",
      copyValue: null,
    };
  }

  return { display: value, copyValue: value };
}
