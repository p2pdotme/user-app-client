import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { getCountryOption } from "@p2pdotme/sdk/country";
import {
  type ParsedQR,
  parseQR,
  QRParserError,
  type SupportedCurrency,
} from "@p2pdotme/sdk/qr-parsers";
import { err } from "neverthrow";
import { isUpiMandateQr } from "./upi-mandate";

export type { ParsedQR, SupportedCurrency };

export async function parseQRData(
  qrData: string,
  currency: CurrencyType,
  sellPrice: number,
  orderId: string,
) {
  // UPI AutoPay mandates register a recurring debit, never a one-off payment.
  if (currency === "INR" && isUpiMandateQr(qrData)) {
    return err(
      new QRParserError("UPI mandate/AutoPay QRs are not supported", {
        code: "INVALID_QR",
      }),
    );
  }

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

/**
 * Names of the payment QR formats each currency's parser accepts. Shown to
 * users when a scanned QR is rejected so they know what to ask for. These are
 * scheme / brand names and are intentionally not translated.
 */
const SUPPORTED_QR_TYPES: Partial<Record<string, string>> = {
  ARS: "Mercado Pago / Transferencias 3.0",
  BOB: "QR Simple",
  BRL: "PIX",
  COP: "Bre-B / Colombian bank QR",
  CUP: "Transfermóvil",
  ECU: "DeUna",
  IDR: "QRIS",
  INR: "UPI",
  NGN: "NQR",
  PEN: "Yape / Plin",
  PHP: "QR Ph",
  VEN: "Pago Móvil",
};

export function getSupportedQrTypes(currency: string): string | undefined {
  return SUPPORTED_QR_TYPES[currency];
}

/**
 * i18n keys (title, description) for a QR parser / SDK error code. Never
 * surfaces the raw code or the SDK's English message to users.
 */
export function getQrErrorKeys(code: string | undefined): {
  titleKey: string;
  descriptionKey: string;
} {
  switch (code) {
    case "INVALID_AMOUNT":
      return {
        titleKey: "PAYF_QR_INVALID_AMOUNT",
        descriptionKey: "PAYF_QR_INVALID_AMOUNT_DESCRIPTION",
      };
    case "FETCH_FAILED":
      return {
        titleKey: "PAYF_QR_FETCH_FAILED",
        descriptionKey: "PAYF_QR_FETCH_FAILED_DESCRIPTION",
      };
    case "INVALID_CURRENCY":
      return {
        titleKey: "PAYF_QR_WRONG_CURRENCY",
        descriptionKey: "PAYF_QR_WRONG_CURRENCY_DESCRIPTION",
      };
    default:
      return {
        titleKey: "PAYF_QR_NOT_SUPPORTED",
        descriptionKey: "PAYF_QR_NOT_SUPPORTED_DESCRIPTION",
      };
  }
}
