import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import type { ParsedQR, SupportedCurrency } from "@p2pdotme/sdk/qr-parsers";
import { parseQR } from "@p2pdotme/sdk/qr-parsers";

export type { ParsedQR, SupportedCurrency };

export async function parseQRData(
  qrData: string,
  currency: CurrencyType,
  sellPrice: number,
  orderId: string,
) {
  return parseQR({
    qrData,
    currency: currency as SupportedCurrency,
    sellPrice,
    proxyUrl: import.meta.env.VITE_PIX_PROXY_URL,
    orderId,
  });
}
