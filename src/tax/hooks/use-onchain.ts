import { useCallback, useMemo, useRef, useState } from "react";
import {
  fetchTokenTransfers,
  MAX_CSV_BYTES,
  type OnchainError,
  parseTransfersCsv,
  type Reconciliation,
  reconcile,
  type TokenTransfer,
} from "@/tax/core/onchain";
import type { NormalizedOrder } from "@/tax/core/types";
import { createAppError } from "@/tax/lib/errors";
import { walletSetKey } from "@/tax/lib/manual-data";

export type OnchainSource = "EXPLORER" | "CSV";

interface Loaded {
  /** Wallet set the transfers were loaded for */
  key: string;
  source: OnchainSource;
  transfers: TokenTransfer[];
  /** CSV rows that were not valid transfers */
  skipped: number;
  files: string[];
}

export interface OnchainState {
  loaded: Omit<Loaded, "key"> | null;
  loading: boolean;
  error: OnchainError | null;
  /** Fetch every wallet's token transfers from the block explorer */
  fetchFromExplorer: () => Promise<void>;
  /** Read explorer CSV exports (in the browser; nothing is uploaded) */
  loadCsv: (files: readonly File[]) => Promise<void>;
  clear: () => void;
}

/**
 * Token transfers of the wallet set, held in memory only. Loading for one
 * wallet set never shows up under another.
 */
export function useOnchainTransfers(wallets: readonly string[]): OnchainState {
  const key = walletSetKey(wallets);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Loading and errors are tagged with the wallet set they belong to
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<{
    key: string;
    error: OnchainError;
  } | null>(null);
  const busy = useRef(false);

  /** One load at a time; a late result for another wallet set is dropped */
  const run = useCallback(
    async (load: () => Promise<Loaded | OnchainError>) => {
      if (busy.current) return;
      busy.current = true;
      setLoadingKey(key);
      setError(null);
      try {
        const result = await load();
        if ("domain" in result) setError({ key, error: result });
        else setLoaded(result);
      } finally {
        busy.current = false;
        setLoadingKey(null);
      }
    },
    [key],
  );

  const fetchFromExplorer = useCallback(
    () =>
      run(async () => {
        const all: TokenTransfer[] = [];
        let skipped = 0;
        for (const wallet of wallets) {
          const result = await fetchTokenTransfers(wallet);
          if (result.isErr()) return result.error;
          all.push(...result.value.transfers);
          skipped += result.value.skipped;
        }
        return { key, source: "EXPLORER", transfers: all, skipped, files: [] };
      }),
    [key, run, wallets],
  );

  const loadCsv = useCallback(
    (files: readonly File[]) =>
      run(async () => {
        const all: TokenTransfer[] = [];
        let skipped = 0;
        for (const file of files) {
          if (file.size > MAX_CSV_BYTES) return csvReadError("File too large");
          let text: string;
          try {
            text = await file.text();
          } catch (cause: unknown) {
            return csvReadError("Could not read the file", cause);
          }
          const parsed = parseTransfersCsv(text);
          if (parsed.isErr()) return parsed.error;
          all.push(...parsed.value.transfers);
          skipped += parsed.value.skipped;
        }
        // More files for the same wallet set add to what is loaded
        const keep =
          loaded?.key === key && loaded.source === "CSV" ? loaded : null;
        return {
          key,
          source: "CSV",
          transfers: [...(keep?.transfers ?? []), ...all],
          skipped: (keep?.skipped ?? 0) + skipped,
          files: [...(keep?.files ?? []), ...files.map((f) => f.name)],
        };
      }),
    [key, loaded, run],
  );

  const clear = useCallback(() => {
    setLoaded(null);
    setError(null);
  }, []);

  const current = loaded?.key === key ? loaded : null;
  return {
    loaded: current
      ? {
          source: current.source,
          transfers: current.transfers,
          skipped: current.skipped,
          files: current.files,
        }
      : null,
    loading: loadingKey !== null,
    error: error?.key === key ? error.error : null,
    fetchFromExplorer,
    loadCsv,
    clear,
  };
}

const csvReadError = (message: string, cause?: unknown): OnchainError =>
  createAppError(message, { domain: "Onchain", code: "OCCsvError", cause });

/** Reconciliation of the loaded transfers against all orders (memoised). */
export function useReconciliation(
  transfers: readonly TokenTransfer[] | null,
  orders: readonly NormalizedOrder[] | null,
  wallets: readonly string[],
): Reconciliation | null {
  return useMemo(
    () =>
      transfers && orders ? reconcile({ transfers, orders, wallets }) : null,
    [transfers, orders, wallets],
  );
}
