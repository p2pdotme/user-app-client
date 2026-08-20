import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { getCountryOption } from "@p2pdotme/sdk/country";
import {
  type ParsedQR,
  parseQR,
  QRParserError,
  type SupportedCurrency,
} from "@p2pdotme/sdk/qr-parsers";
import { err } from "neverthrow";

export type { ParsedQR, SupportedCurrency };

export async function parseQRData(
  qrData: string,
  currency: CurrencyType,
  sellPrice: number,
  orderId: string,
) {
  const parseResult = await parseQR({
    qrData,
    currency: currency as SupportedCurrency,
    sellPrice,
    proxyUrl: import.meta.env.VITE_PIX_PROXY_URL,
    orderId,
  });
  if (parseResult.isErr()) return parseResult;

  // Same catalog rule as SELL upload (PEN CRC, VEN merchantId, BOB envelope). Lives here so
  // a stale `@p2pdotme/sdk/qr-parsers` prebundle cannot accept a blob that
  // `validateQr` already rejects.
  const validateQr = getCountryOption(currency)?.validateQr;
  if (validateQr && !validateQr(qrData.trim())) {
    return err(
      new QRParserError("Not a valid payment QR", { code: "INVALID_QR" }),
    );
  }

  return parseResult;
}
