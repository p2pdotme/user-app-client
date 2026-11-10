/**
 * Token-transfer CSV exports → TokenTransfer[].
 *
 * Accepts the ERC-20 "Download CSV" export of basescan.org (old and new
 * header names) and the token-transfer CSV export of base.blockscout.com.
 * The file is untrusted: every row is validated and bad rows are skipped.
 * It is read in the browser only; nothing is uploaded anywhere.
 */
import { err, ok, type Result } from "neverthrow";
import Papa from "papaparse";
import { type TokenTransfer, USDC_BASE } from "@/tax/core/onchain/types";
import { D } from "@/tax/lib/decimal";
import { type AppError, createAppError } from "@/tax/lib/errors";

export type OnchainError = AppError<"Onchain">;

/** Header name (lowercase, letters and digits only) → field */
const ALIASES = {
  hash: ["transactionhash", "txhash", "hash", "txnhash"],
  unix: ["unixtimestamp", "timestamp"],
  datetime: ["datetimeutc", "datetime"],
  from: ["from", "fromaddress"],
  to: ["to", "toaddress"],
  value: ["tokenvalue", "value", "tokenstransferred", "quantity", "amount"],
  token: ["contractaddress", "tokencontractaddress", "tokenaddress"],
  symbol: ["tokensymbol", "symbol"],
} as const;

type Field = keyof typeof ALIASES;

const MAX_ROWS = 100_000;
/** Larger files are refused before parsing */
export const MAX_CSV_BYTES = 20 * 1024 * 1024;
const HASH_RE = /^0x[0-9a-f]{64}$/;
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;

const headerKey = (h: string): string =>
  h.toLowerCase().replace(/[^a-z0-9]/g, "");

function columnIndex(
  headers: readonly string[],
): Partial<Record<Field, number>> {
  const keys = headers.map(headerKey);
  const index: Partial<Record<Field, number>> = {};
  for (const field of Object.keys(ALIASES) as Field[]) {
    const at = keys.findIndex((k) =>
      (ALIASES[field] as readonly string[]).includes(k),
    );
    if (at >= 0) index[field] = at;
  }
  return index;
}

/** "1,234.5" → Decimal; negative or malformed → null */
function amountOf(text: string): InstanceType<typeof D> | null {
  const clean = text.trim().replace(/,/g, "");
  return /^\d+(\.\d+)?$/.test(clean) ? new D(clean) : null;
}

function timeOf(
  unix: string | undefined,
  datetime: string | undefined,
): Date | null {
  if (unix && /^\d{9,11}$/.test(unix.trim())) {
    return new Date(Number(unix.trim()) * 1000);
  }
  if (datetime) {
    // Explorer exports give UTC wall-clock time without a zone marker
    const iso = datetime.trim().replace(" ", "T");
    const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

const csvError = (message: string, cause?: unknown): OnchainError =>
  createAppError(message, { domain: "Onchain", code: "OCCsvError", cause });

/**
 * Parse an explorer CSV. Rows that are not valid transfers are dropped; the
 * count is returned so the UI can say how many were skipped.
 */
export function parseTransfersCsv(
  text: string,
): Result<{ transfers: TokenTransfer[]; skipped: number }, OnchainError> {
  if (text.length > MAX_CSV_BYTES) return err(csvError("File too large"));
  const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), {
    skipEmptyLines: true,
  });
  const [headers, ...rows] = parsed.data;
  if (!headers) return err(csvError("Empty file"));
  const col = columnIndex(headers);
  // The contract column is needed: a fake token can be named "USDC"
  const required: Field[] = ["hash", "from", "to", "value", "token"];
  const missing = required.filter((f) => col[f] === undefined);
  if (
    missing.length > 0 ||
    (col.unix === undefined && col.datetime === undefined)
  ) {
    return err(csvError("Missing columns", { missing }));
  }
  if (rows.length > MAX_ROWS) return err(csvError("Too many rows"));

  const cell = (row: string[], f: Field): string | undefined => {
    const i = col[f];
    return i === undefined ? undefined : row[i]?.trim();
  };
  const transfers: TokenTransfer[] = [];
  let skipped = 0;
  for (const row of rows) {
    const txHash = cell(row, "hash")?.toLowerCase() ?? "";
    const from = cell(row, "from")?.toLowerCase() ?? "";
    const to = cell(row, "to")?.toLowerCase() ?? "";
    const amount = amountOf(cell(row, "value") ?? "");
    const time = timeOf(cell(row, "unix"), cell(row, "datetime"));
    const token = cell(row, "token")?.toLowerCase() ?? "";
    const symbol = (cell(row, "symbol") ?? "").slice(0, 20);
    if (
      !HASH_RE.test(txHash) ||
      !ADDRESS_RE.test(from) ||
      !ADDRESS_RE.test(to) ||
      amount === null ||
      time === null ||
      !ADDRESS_RE.test(token)
    ) {
      skipped += 1;
      continue;
    }
    transfers.push({ txHash, time, from, to, token, symbol, amount });
  }
  if (transfers.length === 0 && rows.length > 0) {
    return err(csvError("No valid rows"));
  }
  return ok({ transfers, skipped });
}

/** Is this a USDC (Base) transfer? Decided by the contract, never the symbol. */
export function isUsdc(t: Pick<TokenTransfer, "token">): boolean {
  return t.token === USDC_BASE;
}
