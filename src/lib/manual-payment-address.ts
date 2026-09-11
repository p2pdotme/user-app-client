import {
  CURRENCY,
  type CurrencyCode,
  getIndonesianPaymentProviderType,
  serializeCompoundPaymentId,
  validateIndonesianPaymentId,
  validateStoredPaymentId,
} from "@p2pdotme/sdk/country";

interface ManualPaymentAddressParams {
  currency: { currency: CurrencyCode; paymentAddressName: string };
  manualAddress: string;
  /** Selected IDR provider name from `IDR_PAYMENT_PROVIDERS`; ignored for other currencies. */
  idrPaymentMethod: string;
}

interface ManualPaymentAddress {
  /** i18n key for the payment address label (placeholder, badges). */
  paymentAddressName: string;
  isValid: boolean;
  /** Value stored locally and sent to the contract (IDR packs `Provider|number`). */
  paymentId: string;
}

/**
 * Resolves the label and validity of a manually entered payment address.
 *
 * IDR is the exception: the label and validator depend on the selected provider
 * (bank → account number, e-wallet → phone number), and the payment ID is packed
 * pipe-separated as `Provider|number` (same joiner as other compound currencies).
 * Every other currency uses the country's `paymentAddressName`, the stored-payment-id
 * validator, and the raw input as the payment ID.
 */
export function resolveManualPaymentAddress({
  currency,
  manualAddress,
  idrPaymentMethod,
}: ManualPaymentAddressParams): ManualPaymentAddress {
  // IDR-specific: bank → account number, e-wallet → phone; pack as `Provider|number`.
  if (currency.currency === CURRENCY.IDR) {
    const isBank = getIndonesianPaymentProviderType(idrPaymentMethod) === "bank";
    const value = manualAddress.trim();
    return {
      paymentAddressName: isBank ? "ACCOUNT_NUMBER" : "PHONE_NUMBER",
      isValid: validateIndonesianPaymentId(idrPaymentMethod, value),
      paymentId: value ? serializeCompoundPaymentId(idrPaymentMethod, value) : "",
    };
  }

  return {
    paymentAddressName: currency.paymentAddressName,
    isValid: validateStoredPaymentId(currency.currency, manualAddress),
    paymentId: manualAddress,
  };
}
