import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { P2PSwapStep, P2PSwapDirection, P2PSwapState } from "./use-p2p-swap";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A persisted snapshot of a swap attempt — written at every step, not just completion.
 * Stored in localStorage under STORAGE_KEYS.P2P_SWAP_HISTORY (max 30 entries).
 *
 * Debug links:
 *   Rango:     https://explorer.rango.exchange/swap/<rangoRequestId>
 *   Jupiter:   https://solscan.io/tx/<jupiterSignature>
 *   Wormhole:  https://wormholescan.io/#/tx/<wormholeLockTxHash>
 */
export interface P2PSwapHistoryEntry {
  id: string;
  /** Unix ms timestamp of the first step (swap start time) */
  timestamp: number;
  direction: P2PSwapDirection;
  inputAmount: string;
  /** Updated at every step transition */
  currentStep: P2PSwapStep;
  /** Unix ms timestamp recorded when each step was first entered */
  stepTimestamps: Partial<Record<P2PSwapStep, number>>;
  rangoRequestId: string | null;
  rangoOutputAmount: string | null;
  jupiterSignature: string | null;
  jupiterOutputAmount: string | null;
  /** Wormhole lock-side tx hash */
  wormholeLockTxHash: string | null;
  /** Wormhole redeem-side tx hash */
  wormholeRedeemTxHash: string | null;
  error: string | null;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const MAX_ENTRIES = 100;

export function loadHistory(): P2PSwapHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.P2P_SWAP_HISTORY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Upserts a swap state snapshot into localStorage history, keyed by swapId.
 * Called automatically by the wrapped setState in each swap hook.
 */
export function persistSwapStep(state: P2PSwapState): void {
  if (!state.swapId) return;
  try {
    const history: P2PSwapHistoryEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.P2P_SWAP_HISTORY) ?? "[]",
    );
    const entry: P2PSwapHistoryEntry = {
      id: state.swapId,
      timestamp:
        state.stepTimestamps.rango_preparing ??
        state.stepTimestamps.wormhole_locking ??
        state.stepTimestamps[state.step] ??
        Date.now(),
      direction: state.direction,
      inputAmount: state.inputAmount,
      currentStep: state.step,
      stepTimestamps: state.stepTimestamps,
      rangoRequestId: state.rangoRequestId,
      rangoOutputAmount: state.rangoOutputAmount,
      jupiterSignature: state.jupiterSignature,
      jupiterOutputAmount: state.jupiterOutputAmount,
      wormholeLockTxHash: state.wormholeLockTxHash,
      wormholeRedeemTxHash: state.wormholeRedeemTxHash,
      error: state.error,
    };
    const idx = history.findIndex((e) => e.id === state.swapId);
    if (idx >= 0) {
      history[idx] = entry;
    } else {
      history.unshift(entry);
      if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
    }
    localStorage.setItem(STORAGE_KEYS.P2P_SWAP_HISTORY, JSON.stringify(history));
  } catch { /* ignore */ }
}

/**
 * Patches an existing history entry by id.
 * Used by the p2p swap page to update Wormhole tx hashes from useWormholeBridge state.
 */
export function updateHistoryEntry(
  id: string,
  patch: Partial<Pick<P2PSwapHistoryEntry,
    | "currentStep"
    | "stepTimestamps"
    | "wormholeLockTxHash"
    | "wormholeRedeemTxHash"
    | "error"
  >>,
): void {
  try {
    const history: P2PSwapHistoryEntry[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.P2P_SWAP_HISTORY) ?? "[]",
    );
    const idx = history.findIndex((e) => e.id === id);
    if (idx >= 0) {
      history[idx] = { ...history[idx], ...patch };
      localStorage.setItem(STORAGE_KEYS.P2P_SWAP_HISTORY, JSON.stringify(history));
    }
  } catch { /* ignore */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages the swap history persisted in localStorage.
 *
 * - `history`      — array of past swap attempts, newest first (written at every step)
 * - `clearHistory` — wipe all entries
 */
export function useP2PSwapHistory() {
  const [history, setHistory] = useState<P2PSwapHistoryEntry[]>(loadHistory);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEYS.P2P_SWAP_HISTORY);
    setHistory([]);
  };

  const refreshHistory = () => setHistory(loadHistory());

  return { history, clearHistory, refreshHistory };
}

