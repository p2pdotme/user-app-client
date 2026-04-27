/**
 * Generic utilities for compound payment IDs (multiple fields separated by "|").
 * Use this for any currency that requires more than one input (e.g. VEN: phone + RIF).
 */

import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
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
    .map((part, i) => (labels[i] ? `${labels[i]}: ${part}` : part))
    .join(" | ");
}

/**
 * Returns whether the currency has a compound (multi-field) payment ID.
 */
function isCompoundPaymentId(currency: CurrencyType): boolean {
  return (PAYMENT_ID_FIELDS[currency]?.length ?? 0) > 1;
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
 * For single-field currencies, returns the value as-is.
 * For compound currencies, formats with labels.
 */
export function formatPaymentIdForDisplay(
  paymentId: string,
  currency: CurrencyType,
): string {
  if (!isCompoundPaymentId(currency)) {
    return paymentId;
  }
  return formatCompoundPaymentIdForDisplay(
    paymentId,
    getDisplayLabels(currency),
  );
}
