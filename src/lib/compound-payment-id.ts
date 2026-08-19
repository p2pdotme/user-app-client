/**
 * Generic utilities for compound payment IDs (multiple fields separated by "|").
 * Packed currencies (`qr||field|field`) go through the SDK catalog helpers.
 */

import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import {
  assignStoredPaymentIdToFieldValues,
  deserializeCompoundPaymentId,
  formatCompoundPaymentIdForDisplay,
  formatStoredPaymentIdForDisplay,
  getCountryOption,
  getStoredQrPayload,
  serializeCompoundPaymentId,
  usesPackedPaymentId,
} from "@p2pdotme/sdk/country";
import { PAYMENT_ID_FIELDS, type PaymentIdFieldConfig } from "@/lib/constants";

export {
  deserializeCompoundPaymentId,
  formatCompoundPaymentIdForDisplay,
  serializeCompoundPaymentId,
};

/**
 * Returns the payment ID field configs for a currency.
 */
export function getPaymentIdFields(
  currency: CurrencyType,
): PaymentIdFieldConfig[] {
  return PAYMENT_ID_FIELDS[currency] ?? [];
}

/**
 * Returns display labels for each field of a currency's payment ID.
 * e.g. VEN → [null, "RIF"], INR → [null]
 */
export function getDisplayLabels(currency: CurrencyType): (string | null)[] {
  return getPaymentIdFields(currency).map((f) => f.displayLabel);
}

/**
 * Formats a payment ID for display using the currency's config.
 * Packed QR-only ids return "" so callers can substitute a label.
 */
export function formatPaymentIdForDisplay(
  paymentId: string,
  currency: CurrencyType,
): string {
  const formatted = formatStoredPaymentIdForDisplay(currency, paymentId);
  if (formatted) return formatted;
  if (usesPackedPaymentId(currency)) return "";
  return paymentId;
}

/**
 * List/preview string for a stored payment ID. Never dumps a packed QR blob.
 */
export function formatPaymentIdPreview(
  paymentId: string,
  currency: CurrencyType,
  t: (key: string) => string,
): string {
  const formatted = formatPaymentIdForDisplay(paymentId, currency);
  const qr = getStoredQrPayload(currency, paymentId);
  const option = getCountryOption(currency);
  const qrLabel = option ? t(option.paymentAddressName) : "";
  if (qr && formatted && qrLabel) return `${qrLabel} · ${formatted}`;
  if (formatted) return formatted;
  if (qr && qrLabel) return qrLabel;
  return paymentId;
}

export function getPaymentIdDisplayParts(
  paymentId: string,
  currency: CurrencyType,
): { key: string; label: string | null; labelKey: string; value: string }[] {
  const fields = getPaymentIdFields(currency);
  const values = assignStoredPaymentIdToFieldValues(currency, paymentId);
  return fields
    .map((field) => ({
      key: field.key,
      label: field.displayLabel,
      labelKey: field.label,
      value: values[field.key] || "",
    }))
    .filter((part) => part.value.length > 0);
}
