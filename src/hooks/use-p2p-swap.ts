import { isSolanaWallet } from "@dynamic-labs/solana";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useSafeDynamicContext } from "@/contexts";
import {
  deserializeJupiterTransaction,
  orderJupiterP2PToUsdc,
  orderJupiterUsdcToP2P,
  P2P_TOKEN_DECIMALS,
  SOLANA_USDC_DECIMALS,
} from "@/core/jupiter";
import { quoteRango, swapRango } from "@/core/rango";
import { BRIDGE_TOKEN_ADDRESSES } from "@/core/rango/config";
import { handleDeposit } from "@/core/rango/bridgeHandler/deposit";
import { handleWithdraw } from "@/core/rango/bridgeHandler/withdraw";
import type { RangoSwapResponse } from "@/core/rango/types";
import type { DepositState } from "@/pages/deposit/shared";
import type { WithdrawState } from "@/pages/withdraw/shared";
import { captureError } from "@/lib/sentry";
import { STORAGE_KEYS } from "@/lib/constants";
import { useSounds, useThirdweb } from "@/hooks";

// ── Shared types ──────────────────────────────────────────────────────────────

/** All possible steps across both swap directions. */
export type P2PSwapStep =
  | "idle"
  | "rango_preparing"   // Fetching & building the Rango swap transaction
  | "rango_approval"    // Waiting for ERC-20 USDC approval on Base
  | "rango_swapping"    // Broadcasting the Rango bridge transaction
  | "rango_confirming"  // Polling Rango until the bridge confirms on Solana
  | "jupiter_preparing" // Fetching & building the Jupiter swap order
  | "jupiter_swapping"  // Signing & sending the Jupiter transaction on Solana
  | "completed"
  | "failed";

/** Which direction the swap is running. */
export type P2PSwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

/**
 * Live state for an in-progress or terminal swap.
 *
 * USDC_TO_P2P:
 *   jupiterOutputAmount = P2P received (raw units, 6 dec)
 *   rangoOutputAmount   = intermediate Solana USDC (raw units, 6 dec)
 *
 * P2P_TO_USDC:
 *   jupiterOutputAmount = intermediate Solana USDC (raw units, 6 dec)
 *   rangoOutputAmount   = final Base USDC received (raw units, 6 dec)
 */
export interface P2PSwapState {
  step: P2PSwapStep;
  direction: P2PSwapDirection;
  /** Human-readable input amount entered by the user (e.g. "10") */
  inputAmount: string;
  /** Rango requestId — use with https://explorer.rango.exchange/swap/<id> */
  rangoRequestId: string | null;
  rangoOutputAmount: string | null;
  /** Solana transaction signature — use with https://solscan.io/tx/<sig> */
  jupiterSignature: string | null;
  jupiterOutputAmount: string | null;
  error: string | null;
}

// ── History ───────────────────────────────────────────────────────────────────

/**
 * A persisted record of a completed or failed swap attempt.
 * Stored in localStorage under STORAGE_KEYS.P2P_SWAP_HISTORY (max 30 entries).
 *
 * Debug links:
 *   Rango:  https://explorer.rango.exchange/swap/<rangoRequestId>
 *   Solana: https://solscan.io/tx/<jupiterSignature>
 */
export interface P2PSwapHistoryEntry {
  id: string;
  timestamp: number;
  direction: P2PSwapDirection;
  inputAmount: string;
  rangoRequestId: string | null;
  jupiterSignature: string | null;
  jupiterOutputAmount: string | null;
  rangoOutputAmount: string | null;
  finalStep: P2PSwapStep;
  error: string | null;
}

const MAX_ENTRIES = 30;

function loadHistory(): P2PSwapHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.P2P_SWAP_HISTORY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Manages the swap history persisted in localStorage.
 *
 * - `history`    — array of past swap attempts, newest first
 * - `saveEntry`  — prepend a new entry (auto-generates id + timestamp)
 * - `clearHistory` — wipe all entries
 */
export function useP2PSwapHistory() {
  const [history, setHistory] = useState<P2PSwapHistoryEntry[]>(loadHistory);

  const saveEntry = (entry: Omit<P2PSwapHistoryEntry, "id" | "timestamp">) => {
    const newEntry: P2PSwapHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry,
    };
    setHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEYS.P2P_SWAP_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEYS.P2P_SWAP_HISTORY);
    setHistory([]);
  };

  return { history, saveEntry, clearHistory };
}

// ── Shared internals ──────────────────────────────────────────────────────────

const SOLANA_USDC_TOKEN = {
  blockchain: "SOLANA",
  address: BRIDGE_TOKEN_ADDRESSES.SOLANA.USDC,
};

function makeInitialState(direction: P2PSwapDirection): P2PSwapState {
  return {
    step: "idle",
    direction,
    inputAmount: "",
    rangoRequestId: null,
    rangoOutputAmount: null,
    jupiterSignature: null,
    jupiterOutputAmount: null,
    error: null,
  };
}

/**
 * Bridges handleWithdraw's WithdrawState setter to P2PSwapState.
 * handleWithdraw only calls setState with status updates — this maps
 * those status strings to the correct P2PSwapStep values.
 */
function makeWithdrawAdapter(
  setState: React.Dispatch<React.SetStateAction<P2PSwapState>>,
): React.Dispatch<React.SetStateAction<WithdrawState>> {
  return (updater) => {
    setState((prev) => {
      const fake: WithdrawState = {
        destinationChain: null,
        destinationToken: null,
        amount: prev.inputAmount,
        recipientAddress: "",
        status: "preparing",
      };
      const next = typeof updater === "function" ? updater(fake) : updater;
      if (next.status === "failed")   return { ...prev, step: "failed", error: "Bridge transaction failed" };
      if (next.status === "approval") return { ...prev, step: "rango_approval" };
      if (next.status === "swapping") return { ...prev, step: "rango_swapping" };
      return prev;
    });
  };
}

/**
 * Bridges handleDeposit's DepositState setter to P2PSwapState.
 * Same pattern as makeWithdrawAdapter — maps Deposit status strings
 * to the correct P2PSwapStep values.
 */
function makeDepositAdapter(
  setState: React.Dispatch<React.SetStateAction<P2PSwapState>>,
): React.Dispatch<React.SetStateAction<DepositState>> {
  return (updater) => {
    setState((prev) => {
      const fake: DepositState = {
        sourceChain: null,
        sourceToken: null,
        amount: prev.inputAmount,
        status: "preparing",
      };
      const next = typeof updater === "function" ? updater(fake) : updater;
      if (next.status === "failed")   return { ...prev, step: "failed", error: "Bridge transaction failed" };
      if (next.status === "approval") return { ...prev, step: "rango_approval" };
      if (next.status === "swapping") return { ...prev, step: "rango_swapping" };
      return prev;
    });
  };
}

// ── useUsdcToP2PSwap ─────────────────────────────────────────────────────────

/**
 * Executes a full Base USDC → P2P token (Solana) swap.
 *
 * Step 1 — Rango WITHDRAW (Base → Solana):
 *   Signs with Thirdweb (Base) account. Polls until bridge confirms.
 *
 * Step 2 — Jupiter swap (Solana USDC → P2P):
 *   Signs with Dynamic Solana wallet. Transaction sent directly to Solana.
 *
 * Steps run automatically with no user action between them.
 * Returns { state, execute(inputAmount), reset, isPending }.
 */
export function useUsdcToP2PSwap() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();
  const sounds = useSounds();

  const [state, setState] = useState<P2PSwapState>(makeInitialState("USDC_TO_P2P"));

  const execute = async (inputAmount: string) => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
      return;
    }
    if (!account?.address) {
      setState((s) => ({ ...s, step: "failed", error: "Base wallet not connected" }));
      return;
    }

    setState({ ...makeInitialState("USDC_TO_P2P"), step: "rango_preparing", inputAmount });

    try {
      const amountInUnits = parseUnits(inputAmount, 6).toString();

      // Step 1: Rango WITHDRAW — Base USDC → Solana USDC
      const swapResult = await swapRango("WITHDRAW", SOLANA_USDC_TOKEN, amountInUnits, account.address, primaryWallet.address);
      if (swapResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: swapResult.error.message })); return; }

      const swapRes: RangoSwapResponse = swapResult.value;
      setState((s) => ({ ...s, rangoRequestId: swapRes.requestId ?? null }));
      if (swapRes.error) { setState((s) => ({ ...s, step: "failed", error: swapRes.error ?? "Rango error" })); return; }

      // Handles approval (if needed) + broadcast + polls until confirmed
      try {
        await handleWithdraw(swapRes, account, makeWithdrawAdapter(setState), sounds);
      } catch (e) {
        setState((s) => s.step !== "failed" ? { ...s, step: "failed", error: (e as Error).message } : s);
        return;
      }

      // Bridge confirmed — Solana USDC arrived in wallet
      const rangoOutputAmount = swapRes.route?.outputAmount ?? null;
      setState((s) => ({ ...s, step: "jupiter_preparing", rangoOutputAmount }));
      if (!rangoOutputAmount) { setState((s) => ({ ...s, step: "failed", error: "Bridge output amount unavailable" })); return; }

      // Step 2: Jupiter — Solana USDC → P2P
      const orderResult = await orderJupiterUsdcToP2P(rangoOutputAmount, primaryWallet.address);
      if (orderResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: orderResult.error.message })); return; }

      const txResult = await deserializeJupiterTransaction(orderResult.value.transaction);
      if (txResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: txResult.error.message })); return; }

      setState((s) => ({ ...s, step: "jupiter_swapping" }));
      const signer = await primaryWallet.getSigner();
      const { signature } = await signer.signAndSendTransaction(txResult.value);

      setState((s) => ({ ...s, step: "completed", jupiterSignature: signature, jupiterOutputAmount: orderResult.value.outAmount }));
      sounds.triggerSuccessSound();
    } catch (error) {
      setState((s) => ({ ...s, step: "failed", error: (error as Error).message }));
      captureError(error, { operation: "usdc_to_p2p_swap", component: "useUsdcToP2PSwap", userId: account?.address });
    }
  };

  const reset = () => setState(makeInitialState("USDC_TO_P2P"));
  return { state, execute, reset, isPending: !["idle", "completed", "failed"].includes(state.step) };
}

// ── useP2PToUsdcSwap ─────────────────────────────────────────────────────────

/**
 * Executes a full P2P token (Solana) → Base USDC swap.
 *
 * Step 1 — Jupiter swap (P2P → Solana USDC):
 *   Signs with Dynamic Solana wallet. Transaction sent directly to Solana.
 *
 * Step 2 — Rango DEPOSIT (Solana → Base):
 *   Signs with Dynamic Solana wallet. Polls until bridge confirms.
 *
 * Steps run automatically with no user action between them.
 * Returns { state, execute(inputAmount), reset, isPending }.
 */
export function useP2PToUsdcSwap() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();
  const sounds = useSounds();

  const [state, setState] = useState<P2PSwapState>(makeInitialState("P2P_TO_USDC"));

  const execute = async (inputAmount: string) => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
      return;
    }
    if (!account?.address) {
      setState((s) => ({ ...s, step: "failed", error: "Base wallet not connected" }));
      return;
    }

    setState({ ...makeInitialState("P2P_TO_USDC"), step: "jupiter_preparing", inputAmount });

    try {
      const amountInUnits = parseUnits(inputAmount, 6).toString();

      // Step 1: Jupiter — P2P → Solana USDC
      const orderResult = await orderJupiterP2PToUsdc(amountInUnits, primaryWallet.address);
      if (orderResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: orderResult.error.message })); return; }

      const txResult = await deserializeJupiterTransaction(orderResult.value.transaction);
      if (txResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: txResult.error.message })); return; }

      setState((s) => ({ ...s, step: "jupiter_swapping" }));
      const signer = await primaryWallet.getSigner();
      const { signature } = await signer.signAndSendTransaction(txResult.value);

      // Jupiter confirmed — Solana USDC is in wallet, now bridge to Base
      const jupiterOutputAmount = orderResult.value.outAmount;
      setState((s) => ({ ...s, jupiterSignature: signature, jupiterOutputAmount, step: "rango_preparing" }));

      // Step 2: Rango DEPOSIT — Solana USDC → Base USDC
      const swapResult = await swapRango("DEPOSIT", SOLANA_USDC_TOKEN, jupiterOutputAmount, primaryWallet.address, account.address);
      if (swapResult.isErr()) { setState((s) => ({ ...s, step: "failed", error: swapResult.error.message })); return; }

      const swapRes: RangoSwapResponse = swapResult.value;
      setState((s) => ({ ...s, rangoRequestId: swapRes.requestId ?? null }));
      if (swapRes.error) { setState((s) => ({ ...s, step: "failed", error: swapRes.error ?? "Rango error" })); return; }

      // Handles approval (if needed) + broadcast + polls until confirmed
      try {
        await handleDeposit(swapRes, primaryWallet, makeDepositAdapter(setState), sounds);
      } catch (e) {
        setState((s) => s.step !== "failed" ? { ...s, step: "failed", error: (e as Error).message } : s);
        return;
      }

      const rangoOutputAmount = swapRes.route?.outputAmount ?? null;
      setState((s) => ({ ...s, step: "completed", rangoOutputAmount }));
      sounds.triggerSuccessSound();
    } catch (error) {
      setState((s) => ({ ...s, step: "failed", error: (error as Error).message }));
      captureError(error, { operation: "p2p_to_usdc_swap", component: "useP2PToUsdcSwap", userId: account?.address });
    }
  };

  const reset = () => setState(makeInitialState("P2P_TO_USDC"));
  return { state, execute, reset, isPending: !["idle", "completed", "failed"].includes(state.step) };
}

// ── useUsdcToP2PSwapQuote ─────────────────────────────────────────────────────

/**
 * Live two-step quote for Base USDC → P2P token (Solana).
 *
 * Step 1 — Rango WITHDRAW quote (Base USDC → Solana USDC):
 *   Refreshes every 30s. Input: Base USDC amount (6 dec).
 *
 * Step 2 — Jupiter /order quote (Solana USDC → P2P):
 *   Refreshes every 15s. Input: Rango step1 output amount.
 *   Requires Solana wallet connected (taker address).
 *
 * Returns totalOutputAmount (P2P) plus per-step breakdown.
 */
export function useUsdcToP2PSwapQuote(amount: string) {
  const { primaryWallet } = useSafeDynamicContext();
  const solanaAddress = primaryWallet?.address;

  const hasAmount = !!amount && Number(amount) > 0;
  const amountInUnits = hasAmount ? parseUnits(amount, 6).toString() : "0";

  // Step 1: Rango WITHDRAW — Base USDC → Solana USDC
  const rangoWithdrawQuery = useQuery({
    queryKey: ["p2p-swap-quote", "rango-withdraw", amountInUnits],
    queryFn: () => quoteRango("WITHDRAW", SOLANA_USDC_TOKEN, amountInUnits).match((v) => v, (e) => { throw e; }),
    enabled: hasAmount,
    staleTime: 30 * 1000, refetchInterval: 30 * 1000, refetchIntervalInBackground: false,
  });

  const rangoWithdrawOutput = rangoWithdrawQuery.data?.route?.outputAmount ?? null;

  // Step 2: Jupiter /order — Solana USDC → P2P (chained from step 1 output)
  const jupiterQuery = useQuery({
    queryKey: ["p2p-swap-quote", "jupiter-usdc-to-p2p", rangoWithdrawOutput, solanaAddress],
    queryFn: () => orderJupiterUsdcToP2P(rangoWithdrawOutput!, solanaAddress!).match((v) => v, (e) => { throw e; }),
    enabled: !!rangoWithdrawOutput && !!solanaAddress,
    staleTime: 15 * 1000, refetchInterval: 15 * 1000, refetchIntervalInBackground: false,
  });

  const jupiterOutputRaw = jupiterQuery.data?.outAmount ?? null;

  return {
    totalOutputAmount: jupiterOutputRaw ? formatUnits(BigInt(jupiterOutputRaw), P2P_TOKEN_DECIMALS) : null,
    isLoading: (hasAmount && rangoWithdrawQuery.isLoading) || jupiterQuery.isLoading,
    isError: rangoWithdrawQuery.isError || jupiterQuery.isError,
    error: rangoWithdrawQuery.error ?? jupiterQuery.error,
    step1: {
      label: "Bridge", from: "USDC (Base)", to: "USDC (Solana)",
      isLoading: hasAmount && rangoWithdrawQuery.isLoading, isError: rangoWithdrawQuery.isError,
      outputAmount: rangoWithdrawOutput ? formatUnits(BigInt(rangoWithdrawOutput), SOLANA_USDC_DECIMALS) : null,
      feeUsd: rangoWithdrawQuery.data?.route?.feeUsd ?? null,
      estimatedTimeInSeconds: rangoWithdrawQuery.data?.route?.estimatedTimeInSeconds ?? null,
      swapper: rangoWithdrawQuery.data?.route?.swapper?.title ?? null,
      priceImpact: null, route: null,
    },
    step2: {
      label: "Swap", from: "USDC (Solana)", to: "P2P",
      isLoading: jupiterQuery.isLoading, isError: jupiterQuery.isError,
      outputAmount: jupiterOutputRaw ? formatUnits(BigInt(jupiterOutputRaw), P2P_TOKEN_DECIMALS) : null,
      feeUsd: null, estimatedTimeInSeconds: null, swapper: null,
      priceImpact: jupiterQuery.data?.priceImpactPct ?? null,
      route: jupiterQuery.data?.routePlan?.map((r) => r.swapInfo.label).join(" → ") ?? null,
    },
  };
}

// ── useP2PToUsdcSwapQuote ─────────────────────────────────────────────────────

/**
 * Live two-step quote for P2P token (Solana) → Base USDC.
 *
 * Step 1 — Jupiter /order quote (P2P → Solana USDC):
 *   Refreshes every 15s. Requires Solana wallet connected (taker address).
 *
 * Step 2 — Rango DEPOSIT quote (Solana USDC → Base USDC):
 *   Refreshes every 30s. Input: Jupiter step1 output amount.
 *
 * Returns totalOutputAmount (Base USDC) plus per-step breakdown.
 */
export function useP2PToUsdcSwapQuote(amount: string) {
  const { primaryWallet } = useSafeDynamicContext();
  const solanaAddress = primaryWallet?.address;

  const hasAmount = !!amount && Number(amount) > 0;
  const amountInUnits = hasAmount ? parseUnits(amount, 6).toString() : "0";

  // Step 1: Jupiter /order — P2P → Solana USDC
  const jupiterQuery = useQuery({
    queryKey: ["p2p-swap-quote", "jupiter-p2p-to-usdc", amountInUnits, solanaAddress],
    queryFn: () => orderJupiterP2PToUsdc(amountInUnits, solanaAddress!).match((v) => v, (e) => { throw e; }),
    enabled: hasAmount && !!solanaAddress,
    staleTime: 15 * 1000, refetchInterval: 15 * 1000, refetchIntervalInBackground: false,
  });

  const jupiterOutput = jupiterQuery.data?.outAmount ?? null;

  // Step 2: Rango DEPOSIT — Solana USDC → Base USDC (chained from step 1 output)
  const rangoDepositQuery = useQuery({
    queryKey: ["p2p-swap-quote", "rango-deposit", jupiterOutput],
    queryFn: () => quoteRango("DEPOSIT", SOLANA_USDC_TOKEN, jupiterOutput!).match((v) => v, (e) => { throw e; }),
    enabled: !!jupiterOutput,
    staleTime: 30 * 1000, refetchInterval: 30 * 1000, refetchIntervalInBackground: false,
  });

  const rangoDepositOutputRaw = rangoDepositQuery.data?.route?.outputAmount ?? null;

  return {
    totalOutputAmount: rangoDepositOutputRaw ? formatUnits(BigInt(rangoDepositOutputRaw), SOLANA_USDC_DECIMALS) : null,
    isLoading: (hasAmount && jupiterQuery.isLoading) || rangoDepositQuery.isLoading,
    isError: jupiterQuery.isError || rangoDepositQuery.isError,
    error: jupiterQuery.error ?? rangoDepositQuery.error,
    step1: {
      label: "Swap", from: "P2P", to: "USDC (Solana)",
      isLoading: hasAmount && jupiterQuery.isLoading, isError: jupiterQuery.isError,
      outputAmount: jupiterOutput ? formatUnits(BigInt(jupiterOutput), SOLANA_USDC_DECIMALS) : null,
      feeUsd: null, estimatedTimeInSeconds: null, swapper: null,
      priceImpact: jupiterQuery.data?.priceImpactPct ?? null,
      route: jupiterQuery.data?.routePlan?.map((r) => r.swapInfo.label).join(" → ") ?? null,
    },
    step2: {
      label: "Bridge", from: "USDC (Solana)", to: "USDC (Base)",
      isLoading: rangoDepositQuery.isLoading, isError: rangoDepositQuery.isError,
      outputAmount: rangoDepositOutputRaw ? formatUnits(BigInt(rangoDepositOutputRaw), SOLANA_USDC_DECIMALS) : null,
      feeUsd: rangoDepositQuery.data?.route?.feeUsd ?? null,
      estimatedTimeInSeconds: rangoDepositQuery.data?.route?.estimatedTimeInSeconds ?? null,
      swapper: rangoDepositQuery.data?.route?.swapper?.title ?? null,
      priceImpact: null, route: null,
    },
  };
}
