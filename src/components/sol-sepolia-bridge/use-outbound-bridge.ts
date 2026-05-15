import { SolanaWalletConnector } from "@dynamic-labs/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeDynamicContext } from "@/contexts";
import { useThirdweb } from "@/hooks";
import { bridgeOutbound } from "./bridge-outbound";

// Polls instead of 30s WebSocket timeout — devnet can take 60-120s
async function confirmSolanaTx(
  connection: Connection,
  sig: string,
  timeoutMs = 180_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatuses([sig], {
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

// ── Error helpers ─────────────────────────────────────────────────────────────

function extractError(e: unknown, context: string): string {
  console.error(`[SolSepoliaBridge] ${context}:`, e);

  if (!(e instanceof Error)) {
    console.error(`[SolSepoliaBridge] raw value:`, JSON.stringify(e));
    return `${context}: unknown error`;
  }

  // Log full error chain
  const cause = (e as Error & { cause?: unknown }).cause;
  if (cause) console.error(`[SolSepoliaBridge] cause:`, cause);

  const details = (e as Error & { details?: string }).details;
  const shortMessage = (e as Error & { shortMessage?: string }).shortMessage;

  // Return most specific message available
  return details ?? shortMessage ?? e.message ?? `${context}: unexpected error`;
}

function isUserRejection(e: unknown): boolean {
  const msg =
    e instanceof Error
      ? `${e.message} ${(e as Error & { details?: string }).details ?? ""}`
      : String(e);
  const lower = msg.toLowerCase();
  return (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("request interrupted") ||
    lower.includes("cancelled") ||
    lower.includes("canceled")
  );
}
import {
  PENDING_OUTBOUND_KEY,
  SOL_SEPOLIA,
  SOLANA_DEVNET_RPC,
} from "./constants";
import { parseVaa } from "./parse-vaa";
import { postVaa } from "./post-vaa";
import { buildReceiverRedeemTx } from "./redeem-on-solana";
import type { OutboundStep, PendingOutboundBridge } from "./types";

const solanaConnection = new Connection(SOLANA_DEVNET_RPC, "confirmed");

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadBridges(): PendingOutboundBridge[] {
  try {
    const raw = localStorage.getItem(PENDING_OUTBOUND_KEY);
    return raw ? (JSON.parse(raw) as PendingOutboundBridge[]) : [];
  } catch {
    return [];
  }
}

function saveBridges(bridges: PendingOutboundBridge[]) {
  localStorage.setItem(PENDING_OUTBOUND_KEY, JSON.stringify(bridges));
}

function patchBridge(id: string, patch: Partial<PendingOutboundBridge>) {
  const bridges = loadBridges();
  const updated = bridges.map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveBridges(updated);
  return updated;
}

// ── VAA polling ───────────────────────────────────────────────────────────────

async function fetchVaaOnce(sequence: string): Promise<string | null> {
  const url = `${SOL_SEPOLIA.WORMHOLESCAN_API}/api/v1/vaas/${SOL_SEPOLIA.WORMHOLE_CHAIN_ID}/${SOL_SEPOLIA.TB_EMITTER_HEX}/${sequence}`;
  try {
    const res = await fetch(url);
    if (res.status !== 200) return null;
    const json = await res.json();
    return (json?.data?.vaa as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function pollVaa(
  sequence: string,
  onElapsed?: (ms: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const start = Date.now();
  while (!signal?.aborted) {
    const b64 = await fetchVaaOnce(sequence);
    if (b64) return b64;
    onElapsed?.(Date.now() - start);
    await new Promise<void>((r) => setTimeout(r, 5000));
  }
  throw new DOMException("Polling aborted", "AbortError");
}

function vaaB64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOutboundBridge() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();

  const [step, setStep] = useState<OutboundStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [pollElapsedMs, setPollElapsedMs] = useState(0);
  const [activeBridgeId, setActiveBridgeId] = useState<string | null>(null);
  const [pendingBridges, setPendingBridges] = useState<PendingOutboundBridge[]>(
    () => loadBridges(),
  );

  const abortRef = useRef<AbortController | null>(null);

  // On mount — resume any wormhole_pending bridges
  useEffect(() => {
    loadBridges()
      .filter((b) => b.status === "wormhole_pending" && !b.vaaB64)
      .forEach(async (b) => {
        const vaaB64 = await fetchVaaOnce(b.sequence);
        if (vaaB64) {
          setPendingBridges(patchBridge(b.id, { status: "ready_to_redeem", vaaB64 }));
        }
      });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const getSolanaSigner = useCallback(async () => {
    if (!primaryWallet?.address) throw new Error("Solana wallet not connected");
    const connector = primaryWallet.connector as unknown as SolanaWalletConnector;
    const signer = await connector.getSigner();
    if (!signer) throw new Error("Solana wallet signer not available");
    return { signer, address: primaryWallet.address };
  }, [primaryWallet]);

  const startBridge = useCallback(
    async (amountUi: string, recipientSolana: string) => {
      if (!account) {
        setError("EVM wallet not connected");
        return;
      }
      setError(null);
      setStep("approving");
      setStatusMsg("Approve P2PGovToken spend…");

      try {
        const amount = BigInt(
          Math.floor(Number(amountUi) * 10 ** SOL_SEPOLIA.TOKEN_DECIMALS),
        );

        // Convert Solana address to bytes32
        const recipientPk = new PublicKey(recipientSolana);
        const recipientBytes32 = `0x${recipientPk.toBuffer().toString("hex")}` as `0x${string}`;

        setStep("bridging");
        setStatusMsg("Bridge transaction — sign in your wallet…");

        const { evmTxHash, sequence } = await bridgeOutbound(amount, recipientBytes32, account);

        // Persist
        const newBridge: PendingOutboundBridge = {
          id: evmTxHash,
          evmTxHash,
          emitterChain: 10002,
          emitter: SOL_SEPOLIA.TB_EMITTER_HEX,
          sequence,
          amount: amount.toString(),
          recipientSolana,
          status: "wormhole_pending",
          createdAt: Date.now(),
        };
        const withNew = [...loadBridges(), newBridge];
        saveBridges(withNew);
        setPendingBridges(withNew);
        setActiveBridgeId(evmTxHash);
        setStep("wormhole_pending");
        setStatusMsg(null);

        // Poll for VAA
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const vaaB64 = await pollVaa(
          sequence,
          (ms) => setPollElapsedMs(ms),
          abortRef.current.signal,
        );

        const updated = patchBridge(evmTxHash, { status: "ready_to_redeem", vaaB64 });
        setPendingBridges(updated);
        setStep("ready_to_redeem");
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (isUserRejection(e)) {
          setStep("idle");
          setStatusMsg(null);
          return;
        }
        setError(extractError(e, "Bridge outbound"));
        setStep("failed");
      }
    },
    [account],
  );

  const redeemOnSolana = useCallback(
    async (bridgeId: string) => {
      const bridge = loadBridges().find((b) => b.id === bridgeId);
      if (!bridge?.vaaB64) {
        setError("VAA not ready yet");
        return;
      }

      setActiveBridgeId(bridgeId);
      setStep("posting_vaa");
      setStatusMsg("Posting VAA to Solana — sign each verification transaction…");
      setError(null);

      try {
        const { signer, address } = await getSolanaSigner();
        const vaaBytes = vaaB64ToBytes(bridge.vaaB64);
        const parsed = parseVaa(vaaBytes);

        const coreBridgeId = new PublicKey(SOL_SEPOLIA.SOL_CORE_BRIDGE);
        const tokenBridgeId = new PublicKey(SOL_SEPOLIA.SOL_TOKEN_BRIDGE);
        const receiverId = new PublicKey(SOL_SEPOLIA.RECEIVER_PROGRAM_ID);
        const mintPk = new PublicKey(SOL_SEPOLIA.SPL_P2P_MINT);
        const recipientPk = new PublicKey(bridge.recipientSolana);

        // signTransaction callback for postVaa
        const signTx = (tx: import("@solana/web3.js").Transaction) =>
          signer.signTransaction(tx);

        await postVaa(
          solanaConnection,
          signTx,
          coreBridgeId,
          address,
          vaaBytes,
          parsed,
          (msg) => setStatusMsg(msg),
        );

        setStep("redeeming");
        setStatusMsg("Calling receiver.redeem on Solana…");

        const redeemTx = await buildReceiverRedeemTx(
          solanaConnection,
          new PublicKey(address),
          parsed,
          coreBridgeId,
          tokenBridgeId,
          receiverId,
          mintPk,
          recipientPk,
        );

        const signedRedeem = await signTx(redeemTx);
        const redeemSig = await solanaConnection.sendRawTransaction(
          signedRedeem.serialize(),
        );
        await confirmSolanaTx(solanaConnection, redeemSig);

        const updated = patchBridge(bridgeId, {
          status: "redeemed",
          redeemTxSig: redeemSig,
        });
        setPendingBridges(updated);
        setStep("completed");
        setStatusMsg(null);
      } catch (e) {
        if (isUserRejection(e)) {
          setStep("ready_to_redeem");
          setStatusMsg(null);
          return;
        }
        setError(extractError(e, "Solana redeem"));
        setStep("failed");
      }
    },
    [getSolanaSigner],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStep("idle");
    setError(null);
    setStatusMsg(null);
    setActiveBridgeId(null);
    setPollElapsedMs(0);
  }, []);

  return {
    step,
    error,
    statusMsg,
    pollElapsedMs,
    activeBridgeId,
    pendingBridges,
    startBridge,
    redeemOnSolana,
    reset,
  };
}
