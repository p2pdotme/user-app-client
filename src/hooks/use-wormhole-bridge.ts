import { isSolanaWallet } from "@dynamic-labs/solana";
import { useActiveAccount } from "thirdweb/react";
import { useState, useCallback } from "react";
import { useSafeDynamicContext } from "@/contexts";
import { captureError } from "@/lib/sentry";
import {
  DynamicSolanaSigner,
  ThirdwebEvmSigner,
  transferSolanaToEvm,
  transferEvmToSolana,
  resumeSolanaToEvm,
  resumeEvmToSolana,
} from "@/core/wormhole";
import { WORMHOLE_NETWORK } from "@/core/wormhole/config";

// ── Shared state model ────────────────────────────────────────────────────────

export type WormholeBridgeStep =
  | "idle"
  | "locking"      // Step 1: lock on Solana OR burn on Base
  | "awaiting_vaa" // Step 2: waiting for Wormhole guardian VAA
  | "redeeming"    // Step 3: mint on Base OR release on Solana
  | "completed"
  | "failed";

export interface WormholeBridgeState {
  step: WormholeBridgeStep;
  solanaTxIds: string[];
  evmTxHash: string | null;
  error: string | null;
}

const INITIAL_STATE: WormholeBridgeState = {
  step: "idle",
  solanaTxIds: [],
  evmTxHash: null,
  error: null,
};

// ── Solana → Base ─────────────────────────────────────────────────────────────

/**
 * Orchestrates a Solana → Base P2P token transfer via Wormhole NTT.
 *
 * Requires:
 * - A connected Dynamic Labs Solana wallet (primaryWallet)
 * - A connected thirdweb EVM account (useActiveAccount)
 */
export function useWormholeBridge() {
  const { primaryWallet } = useSafeDynamicContext();
  const evmAccount = useActiveAccount();

  const [state, setState] = useState<WormholeBridgeState>(INITIAL_STATE);
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const bridge = useCallback(
    async (params: { amount: string; recipientEvmAddress: string }) => {
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
        return;
      }
      if (!evmAccount) {
        setState((s) => ({ ...s, step: "failed", error: "EVM wallet not connected" }));
        return;
      }

      setState({ ...INITIAL_STATE, step: "locking" });

      const solanaSigner = new DynamicSolanaSigner<typeof WORMHOLE_NETWORK>(primaryWallet);
      const evmSigner = new ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>(evmAccount);

      const result = await transferSolanaToEvm(
        { amount: params.amount, recipientEvmAddress: params.recipientEvmAddress, solanaSigner, evmSigner },
        {
          onLocking:     (txIds) => setState((s) => ({ ...s, step: "locking", solanaTxIds: txIds })),
          onAwaitingVaa: ()      => setState((s) => ({ ...s, step: "awaiting_vaa" })),
          onRedeeming:   ()      => setState((s) => ({ ...s, step: "redeeming" })),
        },
      );

      if (result.isErr()) {
        const err = result.error;
        setState((s) => ({ ...s, step: "failed", error: err.message }));
        captureError(err, {
          operation: "wormhole_solana_to_base",
          component: "useWormholeBridge",
          userId: evmAccount.address,
          extra: { amount: params.amount, recipient: params.recipientEvmAddress },
        });
        return;
      }

      setState((s) => ({
        ...s,
        step: "completed",
        solanaTxIds: s.solanaTxIds.length ? s.solanaTxIds : [result.value.solanaTxId],
        evmTxHash: result.value.baseTxHash,
      }));
    },
    [primaryWallet, evmAccount],
  );

  const resume = useCallback(
    async (solanaTxIdOrUrl: string) => {
      if (!evmAccount) {
        setState((s) => ({ ...s, step: "failed", error: "EVM wallet not connected" }));
        return;
      }

      setState({ ...INITIAL_STATE, step: "awaiting_vaa" });

      const evmSigner = new ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>(evmAccount);

      const result = await resumeSolanaToEvm(
        { solanaTxIdOrUrl, evmSigner },
        {
          onAwaitingVaa: () => setState((s) => ({ ...s, step: "awaiting_vaa" })),
          onRedeeming:   () => setState((s) => ({ ...s, step: "redeeming" })),
        },
      );

      if (result.isErr()) {
        const err = result.error;
        setState((s) => ({ ...s, step: "failed", error: err.message }));
        captureError(err, {
          operation: "wormhole_resume_solana_to_base",
          component: "useWormholeBridge",
          userId: evmAccount.address,
          extra: { solanaTxIdOrUrl },
        });
        return;
      }

      setState((s) => ({
        ...s,
        step: "completed",
        solanaTxIds: s.solanaTxIds.length ? s.solanaTxIds : (result.value.solanaTxId ? [result.value.solanaTxId] : s.solanaTxIds),
        evmTxHash: result.value.baseTxHash,
      }));
    },
    [evmAccount],
  );

  return {
    state,
    bridge,
    resume,
    reset,
    isReady: !!primaryWallet && isSolanaWallet(primaryWallet) && !!evmAccount,
    solanaAddress: primaryWallet?.address ?? null,
    evmAddress: evmAccount?.address ?? null,
  };
}

// ── Base → Solana ─────────────────────────────────────────────────────────────

/**
 * Orchestrates a Base → Solana P2P token transfer via Wormhole NTT.
 *
 * Requires:
 * - A connected thirdweb EVM account (useActiveAccount)
 * - A connected Dynamic Labs Solana wallet (primaryWallet) — recipient
 */
export function useBaseToSolanaBridge() {
  const { primaryWallet } = useSafeDynamicContext();
  const evmAccount = useActiveAccount();

  const [state, setState] = useState<WormholeBridgeState>(INITIAL_STATE);
  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const bridge = useCallback(
    async (params: { amount: string; recipientSolanaAddress: string }) => {
      if (!evmAccount) {
        setState((s) => ({ ...s, step: "failed", error: "EVM wallet not connected" }));
        return;
      }
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
        return;
      }

      setState({ ...INITIAL_STATE, step: "locking" });

      const evmSigner = new ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>(evmAccount);
      const solanaSigner = new DynamicSolanaSigner<typeof WORMHOLE_NETWORK>(primaryWallet);

      const result = await transferEvmToSolana(
        { amount: params.amount, recipientSolanaAddress: params.recipientSolanaAddress, evmSigner, solanaSigner },
        {
          onLocking:     (txIds) => setState((s) => ({ ...s, step: "locking", evmTxHash: txIds[txIds.length - 1] ?? null })),
          onAwaitingVaa: ()      => setState((s) => ({ ...s, step: "awaiting_vaa" })),
          onRedeeming:   ()      => setState((s) => ({ ...s, step: "redeeming" })),
        },
      );

      if (result.isErr()) {
        const err = result.error;
        setState((s) => ({ ...s, step: "failed", error: err.message }));
        captureError(err, {
          operation: "wormhole_base_to_solana",
          component: "useBaseToSolanaBridge",
          userId: evmAccount.address,
          extra: { amount: params.amount, recipient: params.recipientSolanaAddress },
        });
        return;
      }

      setState((s) => ({
        ...s,
        step: "completed",
        evmTxHash: s.evmTxHash ?? result.value.baseTxHash,
        solanaTxIds: result.value.solanaTxId ? [result.value.solanaTxId] : s.solanaTxIds,
      }));
    },
    [evmAccount, primaryWallet],
  );

  const resume = useCallback(
    async (baseTxHashOrUrl: string) => {
      if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
        setState((s) => ({ ...s, step: "failed", error: "Solana wallet not connected" }));
        return;
      }

      setState({ ...INITIAL_STATE, step: "awaiting_vaa" });

      const solanaSigner = new DynamicSolanaSigner<typeof WORMHOLE_NETWORK>(primaryWallet);

      const result = await resumeEvmToSolana(
        { baseTxHashOrUrl, solanaSigner },
        {
          onAwaitingVaa: () => setState((s) => ({ ...s, step: "awaiting_vaa" })),
          onRedeeming:   () => setState((s) => ({ ...s, step: "redeeming" })),
        },
      );

      if (result.isErr()) {
        const err = result.error;
        setState((s) => ({ ...s, step: "failed", error: err.message }));
        if (evmAccount) {
          captureError(err, {
            operation: "wormhole_resume_base_to_solana",
            component: "useBaseToSolanaBridge",
            userId: evmAccount.address,
            extra: { baseTxHashOrUrl },
          });
        }
        return;
      }

      setState((s) => ({
        ...s,
        step: "completed",
        evmTxHash: result.value.baseTxHash,
        solanaTxIds: result.value.solanaTxId ? [result.value.solanaTxId] : s.solanaTxIds,
      }));
    },
    [primaryWallet, evmAccount],
  );

  return {
    state,
    bridge,
    resume,
    reset,
    isReady: !!evmAccount && !!primaryWallet && isSolanaWallet(primaryWallet),
    evmAddress: evmAccount?.address ?? null,
    solanaAddress: primaryWallet?.address ?? null,
  };
}
