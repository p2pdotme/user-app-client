/**
 * Token transfers of a wallet from a block explorer with an Etherscan-style
 * API (`module=account&action=tokentx`). Default: Blockscout for Base, which
 * needs no API key. Override with VITE_EXPLORER_API_URL.
 *
 * Only used when the user presses "Check on-chain transfers": the wallet
 * address is then sent to the explorer. The CSV upload (csv.ts) is the
 * offline alternative.
 */
import { errAsync, ResultAsync } from "neverthrow";
import { z } from "zod";
import type { OnchainError } from "@/tax/core/onchain/csv";
import type { TokenTransfer } from "@/tax/core/onchain/types";
import { normalizeAddress } from "@/tax/core/subgraph/client";
import { fromUnits } from "@/tax/lib/decimal";
import { createAppError, isAppError } from "@/tax/lib/errors";

const DEFAULT_EXPLORER_API_URL = "https://base.blockscout.com/api";

const UrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"));

function resolveExplorerUrl(): string {
  const override = import.meta.env?.VITE_EXPLORER_API_URL;
  if (!override) return DEFAULT_EXPLORER_API_URL;
  const parsed = UrlSchema.safeParse(override);
  return parsed.success ? parsed.data : DEFAULT_EXPLORER_API_URL;
}

export const EXPLORER_API_URL: string = resolveExplorerUrl();
export const EXPLORER_HOST: string = new URL(EXPLORER_API_URL).host;

const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

const RowSchema = z.object({
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  timeStamp: z.string().regex(/^\d+$/),
  from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  value: z.string().regex(/^\d+$/),
  contractAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  tokenDecimal: z.string().regex(/^\d{1,2}$/),
  tokenSymbol: z.string().catch(""),
});

const PageSchema = z.object({
  status: z.string(),
  message: z.string().catch(""),
  // An empty history comes back as status "0" with an empty list
  result: z.array(z.unknown()),
});

export type ExplorerPageFetcher = (
  url: string,
  signal?: AbortSignal,
) => Promise<unknown>;

const defaultFetcher: ExplorerPageFetcher = async (url, signal) => {
  const res = await fetch(url, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const ocError = (
  code: OnchainError["code"],
  message: string,
  cause?: unknown,
): OnchainError => createAppError(message, { domain: "Onchain", code, cause });

function toTransfer(row: z.infer<typeof RowSchema>): TokenTransfer {
  return {
    txHash: row.hash.toLowerCase(),
    time: new Date(Number(row.timeStamp) * 1000),
    from: row.from.toLowerCase(),
    to: row.to.toLowerCase(),
    token: row.contractAddress.toLowerCase(),
    symbol: row.tokenSymbol.slice(0, 20),
    amount: fromUnits(row.value, Number(row.tokenDecimal)),
  };
}

export interface ExplorerResult {
  transfers: TokenTransfer[];
  /** Rows that were not valid ERC-20 transfers */
  skipped: number;
}

export interface ExplorerOptions {
  fetchPage?: ExplorerPageFetcher;
  baseUrl?: string;
  signal?: AbortSignal;
}

/** Every ERC-20 transfer to or from `address`, oldest first. */
export function fetchTokenTransfers(
  address: string,
  opts: ExplorerOptions = {},
): ResultAsync<ExplorerResult, OnchainError> {
  const wallet = normalizeAddress(address);
  if (!wallet) return errAsync(ocError("OCParseError", "Invalid address"));
  const fetchPage = opts.fetchPage ?? defaultFetcher;
  const base = opts.baseUrl ?? EXPLORER_API_URL;

  const run = async (): Promise<ExplorerResult> => {
    const all: TokenTransfer[] = [];
    let skipped = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const params = new URLSearchParams({
        module: "account",
        action: "tokentx",
        address: wallet,
        sort: "asc",
        page: String(page),
        offset: String(PAGE_SIZE),
      });
      let raw: unknown;
      try {
        raw = await fetchPage(`${base}?${params}`, opts.signal);
      } catch (cause: unknown) {
        throw ocError("OCNetworkError", "Explorer unreachable", cause);
      }
      const parsed = PageSchema.safeParse(raw);
      if (!parsed.success) {
        throw ocError(
          "OCParseError",
          "Unexpected explorer response",
          parsed.error,
        );
      }
      const rows = parsed.data.result.flatMap((r) => {
        const row = RowSchema.safeParse(r);
        return row.success ? [toTransfer(row.data)] : [];
      });
      // Rows that are not ERC-20 transfers (e.g. NFTs) are counted, not fatal
      skipped += parsed.data.result.length - rows.length;
      all.push(...rows);
      if (parsed.data.result.length < PAGE_SIZE)
        return { transfers: all, skipped };
    }
    throw ocError("OCTooManyPages", "Too many pages");
  };

  return ResultAsync.fromPromise(run(), (e) =>
    isAppError(e) && e.domain === "Onchain"
      ? (e as OnchainError)
      : ocError("OCNetworkError", "Unexpected explorer failure", e),
  );
}
