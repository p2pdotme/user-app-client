import {
  CURRENCY,
  formatStoredPaymentIdForDisplay,
  PEN_QR_COMPOUND_SEP,
  parsePeruvianPaymentId,
  serializePeruvianPaymentId,
  uploadsPaymentQR,
  validatePeruvianCci,
  validatePeruvianPaymentId,
  validatePeruvianPaymentKey,
  validatePeruvianPhone,
  validatePeruvianQr,
} from "@p2pdotme/sdk/country";
import { parseQR } from "@p2pdotme/sdk/qr-parsers";
import QrScanner from "qr-scanner";
import type { CurrencyType } from "@/lib/constants";

export {
  PEN_QR_COMPOUND_SEP,
  parsePeruvianPaymentId as parsePeruPaymentId,
  serializePeruvianPaymentId as serializePeruPaymentId,
  validatePeruvianPaymentId as isValidPeruPaymentId,
  validatePeruvianQr as isValidPeruQrPayload,
  validatePeruvianCci as isValidPeruvianCci,
  validatePeruvianPhone as isValidPeruvianPhone,
  validatePeruvianPaymentKey as isValidPeruvianPaymentKey,
};

export function isPeru(currency: CurrencyType | null | undefined): boolean {
  return currency === CURRENCY.PEN;
}

export function getPeruQrPayload(
  value: string | null | undefined,
): string | null {
  return parsePeruvianPaymentId(value).qr;
}

export function getPeruFallbackParts(
  value: string | null | undefined,
): { key: "phone" | "cci"; value: string }[] {
  const { phone, cci } = parsePeruvianPaymentId(value);
  const parts: { key: "phone" | "cci"; value: string }[] = [];
  if (phone) parts.push({ key: "phone", value: phone });
  if (cci) parts.push({ key: "cci", value: cci });
  return parts;
}

export function formatPeruReceiptValue(
  value: string | null | undefined,
  qrLabel: string,
): { display: string; copyValue: string | null } {
  if (!value) return { display: "", copyValue: null };
  const fallback = getPeruFallbackParts(value)
    .map((part) => part.value)
    .join(" · ");
  if (fallback) {
    return { display: fallback, copyValue: fallback };
  }
  const formatted = formatStoredPaymentIdForDisplay("PEN", value);
  if (formatted) {
    return { display: formatted, copyValue: formatted };
  }
  if (uploadsPaymentQR("PEN") && getPeruQrPayload(value)) {
    return { display: qrLabel, copyValue: null };
  }
  return { display: "", copyValue: null };
}

export interface PeruQrDetails {
  payload: string;
  accountName?: string;
  city?: string;
}

export type PeruQrError = "READ_ERROR" | "INVALID_QR";

function readEmvcoTag(payload: string, tagId: string): string | undefined {
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number.parseInt(payload.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len) || len < 0 || i + 4 + len > payload.length) {
      return undefined;
    }
    const value = payload.slice(i + 4, i + 4 + len);
    if (tag === tagId) return value;
    i += 4 + len;
  }
  return undefined;
}

export async function decodePeruQrImage(file: File): Promise<PeruQrDetails> {
  let payload: string;
  try {
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    });
    payload = result.data.trim();
  } catch {
    throw "READ_ERROR" satisfies PeruQrError;
  }

  if (!payload || !validatePeruvianQr(payload)) {
    throw "INVALID_QR" satisfies PeruQrError;
  }

  const parsed = await parseQR({
    qrData: payload,
    currency: CURRENCY.PEN,
    sellPrice: 1,
  });
  if (parsed.isErr()) {
    throw "INVALID_QR" satisfies PeruQrError;
  }

  return {
    payload,
    accountName: readEmvcoTag(payload, "59")?.trim() || undefined,
    city: readEmvcoTag(payload, "60")?.trim() || undefined,
  };
}
