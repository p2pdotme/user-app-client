import { SolanaWalletConnector } from "@dynamic-labs/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeDynamicContext } from "@/contexts";
import { useThirdweb } from "@/hooks";
import { buildBridgeTx } from "./build-bridge-tx";
import {
  PENDING_BRIDGES_STORAGE_KEY,
  SOLANA_DEVNET_RPC,
  WORMHOLE,
} from "./constants";
import { fetchVaaOnce, parseSequenceFromLogs, pollVaa, vaaB64ToBytes } from "./poll-vaa";
import { redeemOnBase } from "./redeem-on-base";
import type { BridgeStep, PendingBridge } from "./types";

// Module-level Solana connection — created once
const solanaConnection = new Connection(SOLANA_DEVNET_RPC, "confirmed");

// Polls getSignatureStatuses instead of relying on the 30s WebSocket timeout.
// Devnet can take 60-120s to confirm — this waits up to 3 minutes.
async function confirmTx(sig: string, timeoutMs = 180_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await solanaConnection.getSignatureStatuses([sig], {
      searchTransactionHistory: true,
    });
    const status = value[0];
    if (status?.err) throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }
    await new Promise<void>((r) => setTimeout(r, 3000));
  }
  throw new Error(`Transaction not confirmed after ${timeoutMs / 1000}s — sig: ${sig}`);
}

// --- localStorage helpers ---

function loadBridges(): PendingBridge[] {
  try {
    const raw = localStorage.getItem(PENDING_BRIDGES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingBridge[]) : [];
  } catch {
    return [];
  }
}

function saveBridges(bridges: PendingBridge[]) {
  localStorage.setItem(PENDING_BRIDGES_STORAGE_KEY, JSON.stringify(bridges));
}

function patchBridge(
  id: string,
  patch: Partial<PendingBridge>,
): PendingBridge[] {
  const bridges = loadBridges();
  const updated = bridges.map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveBridges(updated);
  return updated;
}

// ---

export function useWormholeBridge() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();

  const [step, setStep] = useState<BridgeStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pollElapsedMs, setPollElapsedMs] = useState(0);
  const [activeBridgeId, setActiveBridgeId] = useState<string | null>(null);
  const [pendingBridges, setPendingBridges] = useState<PendingBridge[]>(() =>
    loadBridges(),
  );

  const abortRef = useRef<AbortController | null>(null);

  // On mount — check if any wormhole_pending bridges now have a VAA available
  useEffect(() => {
    const bridges = loadBridges();
    const pending = bridges.filter(
      (b) => b.status === "wormhole_pending" && !b.vaaB64,
    );
    pending.forEach(async (bridge) => {
      const vaaB64 = await fetchVaaOnce(bridge.emitter, bridge.sequence);
      if (vaaB64) {
        const updated = patchBridge(bridge.id, {
          status: "ready_to_redeem",
          vaaB64,
        });
        setPendingBridges(updated);
      }
    });
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const startBridge = useCallback(
    async (amountUi: string, recipientEvm: string) => {
      if (!primaryWallet?.address) {
        setError("Solana wallet not connected");
        return;
      }
      if (!account) {
        setError("EVM wallet not connected");
        return;
      }

      setError(null);
      setStep("sending");

      try {
        const amount = BigInt(
          Math.floor(Number(amountUi) * 10 ** WORMHOLE.SPL_DECIMALS),
        );
        const userPubkey = new PublicKey(primaryWallet.address);

        // Build the combined Approve + bridge_to_base transaction
        const tx = await buildBridgeTx({
          amount,
          recipientEvm,
          userPubkey,
          connection: solanaConnection,
        });

        // Sign with user's Solana wallet via Dynamic connector
        const connector =
          primaryWallet.connector as unknown as SolanaWalletConnector;
        const signer = await connector.getSigner();
        if (!signer) throw new Error("Solana wallet signer not available");

        const signedTx = await signer.signTransaction(tx);

        // Send to devnet
        const sig = await solanaConnection.sendRawTransaction(
          signedTx.serialize(),
          { skipPreflight: false, maxRetries: 3 },
        );
        await confirmTx(sig);

        // Extract Wormhole sequence from tx logs
        const txInfo = await solanaConnection.getTransaction(sig, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        const sequence = parseSequenceFromLogs(
          txInfo?.meta?.logMessages ?? [],
        );

        // Persist the pending bridge immediately
        const newBridge: PendingBridge = {
          id: sig,
          direction: "solana_to_base",
          txSig: sig,
          emitterChain: 1,
          emitter: WORMHOLE.TB_EMITTER_HEX,
          sequence,
          amount: amount.toString(),
          recipientEvm,
          status: "wormhole_pending",
          createdAt: Date.now(),
        };
        const withNew = [...loadBridges(), newBridge];
        saveBridges(withNew);
        setPendingBridges(withNew);
        setActiveBridgeId(sig);
        setStep("wormhole_pending");

        // Start polling for VAA
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const vaaB64 = await pollVaa(
          WORMHOLE.TB_EMITTER_HEX,
          sequence,
          (ms) => setPollElapsedMs(ms),
          abortRef.current.signal,
        );

        const withVaa = patchBridge(sig, { status: "ready_to_redeem", vaaB64 });
        setPendingBridges(withVaa);
        setStep("ready_to_redeem");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Bridge failed";
        if (msg.toLowerCase().includes("user rejected")) {
          setStep("idle");
          return;
        }
        setError(msg);
        setStep("failed");
      }
    },
    [primaryWallet, account],
  );

  const redeem = useCallback(
    async (bridgeId: string) => {
      if (!account) {
        setError("EVM wallet not connected");
        return;
      }

      const bridge = loadBridges().find((b) => b.id === bridgeId);
      if (!bridge?.vaaB64) {
        setError("VAA not ready yet — please wait");
        return;
      }

      setActiveBridgeId(bridgeId);
      setStep("redeeming");
      setError(null);

      try {
        const vaaBytes = vaaB64ToBytes(bridge.vaaB64);
        const txHash = await redeemOnBase(vaaBytes, account);
        const updated = patchBridge(bridgeId, {
          status: "redeemed",
          redeemTxHash: txHash,
        });
        setPendingBridges(updated);
        setStep("completed");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Redeem failed";
        // AlreadyConsumed means funds already arrived — treat as success
        if (msg === "ALREADY_CONSUMED") {
          const updated = patchBridge(bridgeId, { status: "redeemed" });
          setPendingBridges(updated);
          setStep("completed");
          return;
        }
        setError(msg);
        setStep("failed");
      }
    },
    [account],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStep("idle");
    setError(null);
    setActiveBridgeId(null);
    setPollElapsedMs(0);
  }, []);

  return {
    step,
    error,
    pollElapsedMs,
    activeBridgeId,
    pendingBridges,
    startBridge,
    redeem,
    reset,
  };
}
