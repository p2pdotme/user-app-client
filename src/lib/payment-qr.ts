import { type CurrencyCode, getCountryOption } from "@p2pdotme/sdk/country";

export type PaymentQrError = "READ_ERROR" | "INVALID_QR";

/**
 * Reads a QR image, then validates the payload with `CountryOption.validateQr`
 * (`qr-validator.ts` in the SDK). Image scanning cannot live in the SDK.
 */
export async function decodePaymentQrImage(
  file: File,
  currency: CurrencyCode,
): Promise<{ payload: string }> {
  const option = getCountryOption(currency);
  if (!option?.validateQr) throw "INVALID_QR" satisfies PaymentQrError;

  let payload: string;
  try {
    // Loaded on demand so the QR decoder isn't part of the startup bundle.
    const { default: QrScanner } = await import("qr-scanner");
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    });
    payload = result.data.trim();
  } catch {
    throw "READ_ERROR" satisfies PaymentQrError;
  }

  if (!payload || !option.validateQr(payload)) {
    throw "INVALID_QR" satisfies PaymentQrError;
  }

  return { payload };
}
