import type { BridgeChain, BridgeToken } from "@/core/rango";
import type { RangoSwapResponse } from "@/core/rango/types";

export type DepositStatus =
  | "idle"
  | "preparing"
  | "approval"
  | "swapping"
  | "completed"
  | "failed";

export interface DepositState {
  sourceChain: BridgeChain | null;
  sourceToken: BridgeToken | null;
  amount: string;
  status: DepositStatus;
}

export const DEPOSIT_PROGRESS_STEPS = [
  {
    key: "approval",
    activeTextKey: "APPROVING",
    completedTextKey: "APPROVED",
  },
  {
    key: "swapping",
    activeTextKey: "SWAPPING",
    completedTextKey: "SWAPPED",
  },
] as const;

/**
 * Mobile wallet deep-links (e.g. Phantom on iOS) can reload the browser tab
 * when returning from the wallet app, wiping React state. We persist enough
 * deposit context to localStorage so the user can recover after the refresh
 * instead of losing their selection / not knowing if their tx went through.
 */
export const PENDING_DEPOSIT_KEY = "p2p_pending_deposit";
export const PENDING_DEPOSIT_TTL_MS = 30 * 60 * 1000;

export interface PendingDeposit {
  requestId: string;
  depositData: DepositState;
  swapResponse: RangoSwapResponse;
  startedAt: number;
}

export const savePendingDeposit = (data: PendingDeposit) => {
  try {
    localStorage.setItem(PENDING_DEPOSIT_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[Deposit] Failed to persist pending deposit", err);
  }
};

export const loadPendingDeposit = (): PendingDeposit | null => {
  try {
    const raw = localStorage.getItem(PENDING_DEPOSIT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDeposit;
    if (
      !parsed?.startedAt ||
      Date.now() - parsed.startedAt > PENDING_DEPOSIT_TTL_MS
    ) {
      localStorage.removeItem(PENDING_DEPOSIT_KEY);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn("[Deposit] Failed to load pending deposit", err);
    return null;
  }
};

export const clearPendingDeposit = () => {
  try {
    localStorage.removeItem(PENDING_DEPOSIT_KEY);
  } catch {
    // best-effort cleanup
  }
};
