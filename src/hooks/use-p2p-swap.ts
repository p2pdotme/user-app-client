import { isSolanaWallet } from "@dynamic-labs/solana";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useSafeDynamicContext } from "@/contexts";
import {
  deserializeJupiterTransaction,
  orderJupiterUsdcToP2P,
  P2P_TOKEN_DECIMALS,
  SOLANA_USDC_DECIMALS,
} from "@/core/jupiter";
import { quoteRango, swapRango } from "@/core/rango";
import { BRIDGE_TOKEN_ADDRESSES } from "@/core/rango/config";
import { handleWithdraw } from "@/core/rango/bridgeHandler/withdraw";
import type { RangoSwapResponse } from "@/core/rango/types";
import type { WithdrawState } from "@/pages/withdraw/shared";
import { captureError } from "@/lib/sentry";
import { useSounds, useThirdweb } from "@/hooks";

// ── Types ─────────────────────────────────────────────────────────────────────

export type P2PSwapStep =
  | "idle"
  | "rango_preparing"   // Fetching Rango swap tx
  | "rango_approval"    // ERC-20 approval on Base
  | "rango_swapping"    // Broadcasting bridge tx
  | "rango_confirming"  // Waiting for bridge confirmation on Solana
  | "jupiter_preparing" // Fetching Jupiter order
  | "jupiter_swapping"  // Signing & sending Jupiter tx
  | "completed"
  | "failed";

export interface P2PSwapState {
  step: P2PSwapStep;
  inputAmount: string;
  rangoRequestId: string | null;
  rangoOutputAmount: string | null; // Solana USDC raw units after bridge
  jupiterSignature: string | null;
  jupiterOutputAmount: string | null; // P2P raw units after Jupiter swap
  error: string | null;
}

const INITIAL_STATE: P2PSwapState = {
  step: "idle",
  inputAmount: "",
  rangoRequestId: null,
  rangoOutputAmount: null,
  jupiterSignature: null,
  jupiterOutputAmount: null,
  error: null,
};

const SOLANA_USDC_TOKEN = {
  blockchain: "SOLANA",
  address: BRIDGE_TOKEN_ADDRESSES.SOLANA.USDC,
};

// ── useP2PSwapQuote ────────────────────────────────────────────────────────────

/**
 * Two-step quote: Base USDC → Solana USDC (Rango) → P2P token (Jupiter).
 * Returns a combined total output plus per-step breakdown.
 */
export function useP2PSwapQuote(amount: string) {
  const { primaryWallet } = useSafeDynamicContext();
  const solanaAddress = primaryWallet?.address;

  const hasAmount = !!amount && Number(amount) > 0;
  const amountInUnits = hasAmount ? parseUnits(amount, 6).toString() : "0";

  // Step 1: Rango — Base USDC → Solana USDC
  const rangoQuery = useQuery({
    queryKey: ["p2p-swap-quote", "rango", amountInUnits],
    queryFn: () =>
      quoteRango("WITHDRAW", SOLANA_USDC_TOKEN, amountInUnits).match(
        (value) => value,
        (error) => { throw error; },
      ),
    enabled: hasAmount,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });

  const rangoOutputRaw = rangoQuery.data?.route?.outputAmount ?? null;

  // Step 2: Jupiter — Solana USDC → P2P
  const jupiterQuery = useQuery({
    queryKey: ["p2p-swap-quote", "jupiter", rangoOutputRaw, solanaAddress],
    queryFn: () =>
      orderJupiterUsdcToP2P(rangoOutputRaw!, solanaAddress!).match(
        (value) => value,
        (error) => { throw error; },
      ),
    enabled: !!rangoOutputRaw && !!solanaAddress,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  });

  const jupiterOutputRaw = jupiterQuery.data?.outAmount ?? null;

  return {
    totalOutputAmount: jupiterOutputRaw
      ? formatUnits(BigInt(jupiterOutputRaw), P2P_TOKEN_DECIMALS)
      : null,
    isLoading: (hasAmount && rangoQuery.isLoading) || jupiterQuery.isLoading,
    isError: rangoQuery.isError || jupiterQuery.isError,
    error: rangoQuery.error ?? jupiterQuery.error,

    rango: {
      isLoading: hasAmount && rangoQuery.isLoading,
      isError: rangoQuery.isError,
      outputAmount: rangoOutputRaw
        ? formatUnits(BigInt(rangoOutputRaw), SOLANA_USDC_DECIMALS)
        : null,
      feeUsd: rangoQuery.data?.route?.feeUsd ?? null,
      estimatedTimeInSeconds: rangoQuery.data?.route?.estimatedTimeInSeconds ?? null,
      swapper: rangoQuery.data?.route?.swapper?.title ?? null,
    },

    jupiter: {
      isLoading: jupiterQuery.isLoading,
      isError: jupiterQuery.isError,
      outputAmount: jupiterOutputRaw
        ? formatUnits(BigInt(jupiterOutputRaw), P2P_TOKEN_DECIMALS)
        : null,
      priceImpact: jupiterQuery.data?.priceImpactPct ?? null,
      route:
        jupiterQuery.data?.routePlan?.map((r) => r.swapInfo.label).join(" → ") ?? null,
    },
  };
}

// ── useP2PSwap ────────────────────────────────────────────────────────────────

/**
 * Executes a full Base USDC → Solana USDC (Rango) → P2P token (Jupiter) swap.
 * Steps run automatically without prompting the user between them.
 */
export function useP2PSwap() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();
  const sounds = useSounds();

  const [state, setState] = useState<P2PSwapState>(INITIAL_STATE);

  const makeWithdrawAdapter =
    (): React.Dispatch<React.SetStateAction<WithdrawState>> =>
    (updater) => {
      setState((prev) => {
        const fake: WithdrawState = {
          destinationChain: null,
          destinationToken: null,
          amount: prev.inputAmount,
          recipientAddress: "",
          status: "preparing",
        };
        const next = typeof updater === "function" ? updater(fake) : updater;

        if (next.status === "failed")
          return { ...prev, step: "failed", error: "Bridge transaction failed" };
        if (next.status === "approval")
          return { ...prev, step: "rango_approval" };
        if (next.status === "swapping")
          return { ...prev, step: "rango_swapping" };
        return prev;
      });
    };

  const execute = async (inputAmount: string) => {
    if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
      setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
      return;
    }
    if (!account?.address) {
      setState((s) => ({ ...s, step: "failed", error: "Base wallet not connected" }));
      return;
    }

    setState({ ...INITIAL_STATE, step: "rango_preparing", inputAmount });

    try {
      // ── Step 1: Rango  Base USDC → Solana USDC ──────────────────────────
      const amountInUnits = parseUnits(inputAmount, 6).toString();

      const swapResult = await swapRango(
        "WITHDRAW",
        SOLANA_USDC_TOKEN,
        amountInUnits,
        account.address,
        primaryWallet.address,
      );

      if (swapResult.isErr()) {
        setState((s) => ({ ...s, step: "failed", error: swapResult.error.message }));
        return;
      }

      const swapRes: RangoSwapResponse = swapResult.value;
      setState((s) => ({ ...s, rangoRequestId: swapRes.requestId ?? null }));

      if (swapRes.error) {
        setState((s) => ({ ...s, step: "failed", error: swapRes.error ?? "Rango error" }));
        return;
      }

      try {
        await handleWithdraw(swapRes, account, makeWithdrawAdapter(), sounds);
      } catch (e) {
        setState((s) =>
          s.step !== "failed"
            ? { ...s, step: "failed", error: (e as Error).message }
            : s,
        );
        return;
      }

      // handleWithdraw resolved → bridge confirmed, Solana USDC received
      const rangoOutputAmount = swapRes.route?.outputAmount ?? null;
      setState((s) => ({ ...s, step: "jupiter_preparing", rangoOutputAmount }));

      if (!rangoOutputAmount) {
        setState((s) => ({ ...s, step: "failed", error: "Bridge output amount unavailable" }));
        return;
      }

      // ── Step 2: Jupiter  Solana USDC → P2P ──────────────────────────────
      const orderResult = await orderJupiterUsdcToP2P(
        rangoOutputAmount,
        primaryWallet.address,
      );

      if (orderResult.isErr()) {
        setState((s) => ({ ...s, step: "failed", error: orderResult.error.message }));
        return;
      }

      const txResult = await deserializeJupiterTransaction(orderResult.value.transaction);

      if (txResult.isErr()) {
        setState((s) => ({ ...s, step: "failed", error: txResult.error.message }));
        return;
      }

      setState((s) => ({ ...s, step: "jupiter_swapping" }));

      const signer = await primaryWallet.getSigner();
      const { signature } = await signer.signAndSendTransaction(txResult.value);

      setState((s) => ({
        ...s,
        step: "completed",
        jupiterSignature: signature,
        jupiterOutputAmount: orderResult.value.outAmount,
      }));

      sounds.triggerSuccessSound();
    } catch (error) {
      setState((s) => ({ ...s, step: "failed", error: (error as Error).message }));
      captureError(error, {
        operation: "p2p_swap_execute",
        component: "useP2PSwap",
        userId: account?.address,
      });
    }
  };

  const reset = () => setState(INITIAL_STATE);

  return { state, execute, reset, isPending: !["idle", "completed", "failed"].includes(state.step) };
}
