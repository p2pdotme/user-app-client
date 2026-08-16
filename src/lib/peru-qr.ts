import { parseQR } from "@p2pdotme/sdk/qr-parsers";
import QrScanner from "qr-scanner";
import { CURRENCY, type CurrencyType } from "@/lib/constants";

/**
 * Peru (PEN) sell payment details: instead of typing a phone/CCI, the user
 * uploads their Yape/Plin QR image. We decode it to the raw EMVCo payload,
 * validate it, and store that payload as the payment address (same slot other
 * currencies use for their typed value). Merchants later re-render it as a QR.
 */

/** Whether the given currency uses the Peru Yape/Plin QR-upload flow. */
export function isPeru(currency: CurrencyType | null | undefined): boolean {
  return currency === CURRENCY.PEN;
}

/**
 * Computes the EMVCo CRC-16/CCITT-FALSE checksum over `data`.
 * Polynomial 0x1021, initial value 0xFFFF — as required by the EMVCo QR spec.
 */
function emvcoCrc16(data: string): number {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc;
}

/**
 * Synchronous structural check that a string looks like a valid EMVCo merchant
 * QR payload (Yape/Plin). Verifies the payload-format-indicator prefix, the
 * trailing CRC tag, and that the embedded CRC matches the computed one.
 */
export function isValidPeruQrPayload(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const payload = value.trim();
  if (!payload.startsWith("0002")) return false;
  const crcTagIndex = payload.lastIndexOf("6304");
  if (crcTagIndex === -1 || crcTagIndex !== payload.length - 8) return false;
  const provided = payload.slice(-4).toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(provided)) return false;
  const computed = emvcoCrc16(payload.slice(0, -4))
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return provided === computed;
}

/** Extracts a human-readable field from an EMVCo payload by top-level tag id. */
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

export interface PeruQrDetails {
  /** Raw EMVCo payload to store as the payment address. */
  payload: string;
  /** Account holder name (EMVCo tag 59), for preview. */
  accountName?: string;
  /** City (EMVCo tag 60), for preview. */
  city?: string;
}

export type PeruQrError = "READ_ERROR" | "INVALID_QR";

/**
 * Decodes an uploaded QR image `File` to its raw EMVCo payload and validates it.
 */
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

  if (!payload || !isValidPeruQrPayload(payload)) {
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

/**
 * Validates a 20-digit Peruvian CCI (Código de Cuenta Interbancario).
 * Spaces are ignored.
 */
export function isValidPeruvianCci(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const cci = value.trim().replace(/\s+/g, "");
  return /^\d{20}$/.test(cci);
}

/** Normalizes a CCI to digits-only for storage. */
export function normalizePeruvianCci(value: string): string {
  return value.trim().replace(/\s+/g, "");
}
