import { parseQR } from "@p2pdotme/sdk/qr-parsers";
import QrScanner from "qr-scanner";
import { CURRENCY, type CurrencyType } from "@/lib/constants";
import {
  deserializeCompoundPaymentId,
  formatPaymentIdForDisplay,
} from "./compound-payment-id";

/** Joins an optional S7B QR payload with `phone|rif|bank` in one stored ID. */
export const VEN_QR_COMPOUND_SEP = "||";

/** Whether the currency uses the Venezuela Pago Móvil QR-upload flow. */
export function isVenezuela(
  currency: CurrencyType | null | undefined,
): boolean {
  return currency === CURRENCY.VEN;
}

/**
 * Structural check for a raw Suiche 7B QR payload (`base64?merchantId=NNNN&…`).
 * Packed `qr||phone|rif|bank` strings are not raw payloads — use
 * `getVenQrPayload` first.
 */
export function isValidVenQrPayload(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.includes(VEN_QR_COMPOUND_SEP)) return false;
  const qIdx = trimmed.indexOf("?");
  if (qIdx < 40) return false;
  const blob = trimmed.substring(0, qIdx);
  if (!/^[A-Za-z0-9+/=]+$/.test(blob)) return false;
  return /(?:^|[?&])merchantId=\d{3,4}(?:&|$)/.test(trimmed.substring(qIdx));
}

/** Legacy typed Pago Móvil id: `phone|rif|bank`. */
export function isValidVenCompoundPaymentId(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const parts = deserializeCompoundPaymentId(value.trim());
  if (parts.length !== 3) return false;
  const [phone, rif, bank] = parts;
  if (!phone || !rif || !bank?.trim()) return false;
  const cleaned = phone.replace(/\D/g, "");
  if (!/^04\d{9}$/.test(cleaned) && !/^4\d{9}$/.test(cleaned)) return false;
  return /^[VEJGRP]\d+$/i.test(rif.trim());
}

export type VenPaymentIdParts = {
  qr: string | null;
  compound: string | null;
};

/**
 * Splits a stored VEN payment ID into QR payload and/or typed fallback.
 * Formats: S7B blob, `phone|rif|bank`, or `blob||phone|rif|bank`.
 */
export function parseVenPaymentId(
  value: string | null | undefined,
): VenPaymentIdParts {
  if (!value || typeof value !== "string") return { qr: null, compound: null };
  const trimmed = value.trim();
  const sep = trimmed.indexOf(VEN_QR_COMPOUND_SEP);
  if (sep >= 0) {
    const left = trimmed.slice(0, sep);
    const right = trimmed.slice(sep + VEN_QR_COMPOUND_SEP.length);
    return {
      qr: isValidVenQrPayload(left) ? left : null,
      compound: right || null,
    };
  }
  if (isValidVenQrPayload(trimmed)) return { qr: trimmed, compound: null };
  if (trimmed.includes("|")) return { qr: null, compound: trimmed };
  return { qr: null, compound: null };
}

export function serializeVenPaymentId(
  qr: string | null | undefined,
  compound: string | null | undefined,
): string {
  const q = qr?.trim() && isValidVenQrPayload(qr.trim()) ? qr.trim() : "";
  const c = compound?.trim() || "";
  if (q && c) return `${q}${VEN_QR_COMPOUND_SEP}${c}`;
  return q || c;
}

export function getVenQrPayload(
  value: string | null | undefined,
): string | null {
  return parseVenPaymentId(value).qr;
}

export function getVenCompoundPaymentId(
  value: string | null | undefined,
): string | null {
  return parseVenPaymentId(value).compound;
}

/**
 * A complete VEN payment ID must include typed phone|rif|bank so there is a
 * fallback when the counterparty cannot scan. The QR is optional.
 */
export function isValidVenPaymentId(value: string): boolean {
  const compound = getVenCompoundPaymentId(value);
  return !!compound && isValidVenCompoundPaymentId(compound);
}

/**
 * Receipt/list display for a stored VEN payment ID: typed Pago Móvil details
 * when present, otherwise a QR label so we never dump the opaque S7B blob.
 */
export function formatVenReceiptValue(
  value: string | null | undefined,
  qrLabel: string,
): { display: string; copyValue: string | null } {
  if (!value) return { display: "", copyValue: null };
  const compound = getVenCompoundPaymentId(value);
  if (compound && isValidVenCompoundPaymentId(compound)) {
    return {
      display: formatPaymentIdForDisplay(value, CURRENCY.VEN),
      copyValue: compound,
    };
  }
  if (getVenQrPayload(value)) {
    return { display: qrLabel, copyValue: null };
  }
  return { display: value, copyValue: value };
}

export type VenQrError = "READ_ERROR" | "INVALID_QR";

/**
 * Decodes an uploaded QR image to its raw Suiche 7B payload and validates it.
 */
export async function decodeVenQrImage(
  file: File,
): Promise<{ payload: string }> {
  let payload: string;
  try {
    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    });
    payload = result.data.trim();
  } catch {
    throw "READ_ERROR" satisfies VenQrError;
  }

  if (!payload || !isValidVenQrPayload(payload)) {
    throw "INVALID_QR" satisfies VenQrError;
  }

  const parsed = await parseQR({
    qrData: payload,
    currency: CURRENCY.VEN,
    sellPrice: 1,
  });
  if (parsed.isErr()) {
    throw "INVALID_QR" satisfies VenQrError;
  }

  return { payload };
}
