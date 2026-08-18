/**
 * Generic utilities for compound payment IDs (multiple fields separated by "|").
 * Packed currencies (`qr||field|field`) go through the SDK catalog helpers.
 */

import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import {
  assignStoredPaymentIdToFieldValues,
  COUNTRY_OPTIONS,
  formatStoredPaymentIdForDisplay,
  unpackPackedPaymentId,
  usesPackedPaymentId,
} from "@p2pdotme/sdk/country";
import { PAYMENT_ID_FIELDS, type PaymentIdFieldConfig } from "@/lib/constants";

/**
 * Serializes multiple fields into a pipe-separated string.
 * e.g. serializeCompoundPaymentId("04121234567", "V12345678") → "04121234567|V12345678"
 */
export function serializeCompoundPaymentId(...fields: string[]): string {
  return fields.join("|");
}

/**
 * Deserializes a pipe-separated payment ID into its component fields.
 * e.g. deserializeCompoundPaymentId("04121234567|V12345678") → ["04121234567", "V12345678"]
 */
export function deserializeCompoundPaymentId(paymentId: string): string[] {
  return paymentId.split("|");
}

/**
 * Formats a compound payment ID for display using optional labels.
 * Fields without a label are shown as-is, fields with a label are shown as "Label: value".
 *
 * e.g. formatCompoundPaymentIdForDisplay("04121234567|V12345678", [null, "RIF"])
 *      → "04121234567 | RIF: V12345678"
 */
export function formatCompoundPaymentIdForDisplay(
  paymentId: string,
  labels: (string | null)[],
): string {
  const parts = deserializeCompoundPaymentId(paymentId);
  return parts
    .map((part, i) => {
      if (!part?.trim()) return null;
      return labels[i] ? `${labels[i]}: ${part}` : part;
    })
    .filter((part): part is string => part !== null)
    .join(" | ");
}

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
  labels: { peruQr: string; venQr: string },
): string {
  const formatted = formatPaymentIdForDisplay(paymentId, currency);
  const { qr } = unpackPackedPaymentId(paymentId);
  const option = COUNTRY_OPTIONS.find((c) => c.currency === currency);
  const hasQr =
    !!qr ||
    (!!option?.validateQr?.(paymentId.trim()) && !paymentId.includes("|"));
  const qrLabel =
    currency === "PEN" ? labels.peruQr : currency === "VEN" ? labels.venQr : "";
  if (hasQr && formatted && qrLabel) return `${qrLabel} · ${formatted}`;
  if (formatted) return formatted;
  if (hasQr && qrLabel) return qrLabel;
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
