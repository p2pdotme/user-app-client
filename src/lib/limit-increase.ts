import type { QueryClient } from "@tanstack/react-query";
import { INTERNAL_HREFS } from "@/lib/constants";

/**
 * Remembers the order a user was in the middle of when they left to raise
 * their limit (Buy/Sell/Pay "Verify to raise", or a fraud-check rejection), so
 * /limits and its verification screens can bring them back with the amount
 * still filled in.
 *
 * Stored in localStorage, not React state or sessionStorage: the hosted
 * verification wizards (Reclaim, liveness, KYC) come back with a full page
 * load, sometimes in a new tab.
 */

export type LimitReturnFlow = "buy" | "sell" | "pay";

export interface LimitReturn {
  flow: LimitReturnFlow;
  /** USDC amount (Buy/Sell) the user had entered. */
  cryptoAmount?: number;
  /** Local-currency amount (Pay bills are entered in fiat). */
  fiatAmount?: number;
  savedAt: number;
}

const STORAGE_KEY = "@P2PME:LIMIT_RETURN";
/** Long enough for a slow verification, short enough not to surprise later. */
const MAX_AGE_MS = 60 * 60 * 1000;

export function saveLimitReturn(entry: Omit<LimitReturn, "savedAt">) {
  try {
    const clean: LimitReturn = { flow: entry.flow, savedAt: Date.now() };
    if (entry.cryptoAmount && entry.cryptoAmount > 0)
      clean.cryptoAmount = entry.cryptoAmount;
    if (entry.fiatAmount && entry.fiatAmount > 0)
      clean.fiatAmount = entry.fiatAmount;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Storage unavailable (private mode quota etc.): the user simply won't get
    // the "continue" shortcut.
  }
}

export function readLimitReturn(): LimitReturn | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LimitReturn>;
    if (
      (parsed.flow !== "buy" &&
        parsed.flow !== "sell" &&
        parsed.flow !== "pay") ||
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > MAX_AGE_MS
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as LimitReturn;
  } catch {
    return null;
  }
}

export function clearLimitReturn() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Where to send the user to resume, with the router state each screen already
 * understands for prefilling its amount.
 */
export function getLimitReturnTarget(entry: LimitReturn): {
  to: string;
  state?: Record<string, unknown>;
} {
  switch (entry.flow) {
    case "buy":
      return {
        to: INTERNAL_HREFS.BUY,
        state: entry.cryptoAmount
          ? { prefill: { crypto: entry.cryptoAmount } }
          : undefined,
      };
    case "sell":
      return {
        to: INTERNAL_HREFS.SELL,
        state: entry.cryptoAmount
          ? { prefillCryptoAmount: entry.cryptoAmount }
          : undefined,
      };
    case "pay":
      return {
        to: INTERNAL_HREFS.PAY,
        state: entry.fiatAmount
          ? { prefill: { fiat: entry.fiatAmount } }
          : undefined,
      };
  }
}

/**
 * Query keys whose values change when a verification or stake raises the
 * user's limit. Prefix matches, so every address/currency variant is covered.
 */
const LIMIT_QUERY_PREFIXES = [
  ["tx-limit"],
  ["user-rp"],
  ["task-ledger"],
  ["on-chain-activity-rp"],
] as const;

export function invalidateLimitQueries(queryClient: QueryClient) {
  return Promise.all(
    LIMIT_QUERY_PREFIXES.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey] }),
    ),
  );
}

/**
 * Refresh limits after a verification/stake succeeded. The limit is read from
 * the contract right after the write confirmed; an RPC node that lags a block
 * can still return the old value, so refresh again a few seconds later.
 */
export function refreshLimitsAfterVerification(queryClient: QueryClient) {
  void invalidateLimitQueries(queryClient);
  for (const delay of [4_000, 12_000]) {
    window.setTimeout(() => void invalidateLimitQueries(queryClient), delay);
  }
}
