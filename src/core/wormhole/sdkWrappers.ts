import { amount, signSendWait, toNative, toUniversal } from "@wormhole-foundation/sdk";
import { ResultAsync } from "neverthrow";
import type { AppError } from "@/lib/errors";
import { createAppError } from "@/lib/errors";
import {
  createWormhole,
  EVM_CHAIN,
  getNttContracts,
  SOLANA_CHAIN,
  VAA_TIMEOUT_MS,
  WORMHOLE_NETWORK,
} from "./config";
import type { DynamicSolanaSigner, ThirdwebEvmSigner } from "./signers";

export interface EvmToSolanaTransferParams {
  /** Amount as a human-readable string, e.g. "1.5" */
  amount: string;
  /** Recipient Solana address (base58) */
  recipientSolanaAddress: string;
  evmSigner: ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>;
  solanaSigner: DynamicSolanaSigner<typeof WORMHOLE_NETWORK>;
}

export interface EvmToSolanaTransferResult {
  baseTxHash: string;
  solanaTxId: string;
}


export interface SolanaToEvmTransferParams {
  /** Amount as a human-readable string, e.g. "1.5" */
  amount: string;
  /** Recipient EVM address (0x…) */
  recipientEvmAddress: string;
  solanaSigner: DynamicSolanaSigner<typeof WORMHOLE_NETWORK>;
  evmSigner: ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>;
}

export interface SolanaToEvmTransferResult {
  solanaTxId: string;
  baseTxHash: string;
}

export type WormholeTransferCallback = {
  onLocking?: (txIds: string[]) => void;
  onAwaitingVaa?: () => void;
  onRedeeming?: () => void;
};

/**
 * Solana → Base (P2P SPL → P2P ERC20) via Wormhole NTT.
 *   1. Lock SPL tokens in the Solana NTT manager (locking mode)
 *   2. Wormhole guardians sign a VAA (~10-15 min on mainnet)
 *   3. Mint ERC20 tokens on Base (burning mode)
 */
export function transferSolanaToEvm(
  params: SolanaToEvmTransferParams,
  callbacks: WormholeTransferCallback = {},
): ResultAsync<SolanaToEvmTransferResult, AppError<"WormholeBridge">> {
  return ResultAsync.fromPromise(
    _transferSolanaToEvm(params, callbacks),
    (error) => {
      console.error("[Wormhole] Transfer failed:", error);
      return createAppError(
        error instanceof Error ? error.message : "Wormhole transfer failed",
        {
          domain: "WormholeBridge",
          code: "WormholeTransferError",
          cause: error,
          context: {
            amount: params.amount,
            recipient: params.recipientEvmAddress,
          },
        },
      );
    },
  );
}

async function _transferSolanaToEvm(
  params: SolanaToEvmTransferParams,
  callbacks: WormholeTransferCallback,
): Promise<SolanaToEvmTransferResult> {
  const { solanaSigner, evmSigner } = params;

  console.log("[Wormhole] Starting transfer", {
    amount: params.amount,
    recipient: params.recipientEvmAddress,
    solanaAddress: solanaSigner.address(),
    evmAddress: evmSigner.address(),
  });

  const wh = await createWormhole();
  const src = wh.getChain(SOLANA_CHAIN);
  const dst = wh.getChain(EVM_CHAIN);

  const srcNtt = await src.getProtocol("Ntt", { ntt: getNttContracts(SOLANA_CHAIN) });
  const dstNtt = await dst.getProtocol("Ntt", { ntt: getNttContracts(EVM_CHAIN) });

  const decimals = await srcNtt.getTokenDecimals();
  const transferAmount = amount.units(amount.parse(params.amount, decimals));

  const dstAddr = {
    chain: EVM_CHAIN,
    address: toUniversal(EVM_CHAIN, params.recipientEvmAddress),
  };

  // ── Step 1: Lock on Solana ────────────────────────────────────────────────
  const transferTxs = srcNtt.transfer(
    toNative(SOLANA_CHAIN, solanaSigner.address()),
    transferAmount,
    dstAddr,
    { queue: false, automatic: false },
  );

  const txids = await signSendWait(src, transferTxs, solanaSigner);
  const solanaTxId = txids[txids.length - 1]!.txid;
  console.log("[Wormhole] Step 1 complete — Solana txids:", txids.map((t) => t.txid));

  callbacks.onLocking?.(txids.map((t) => t.txid));

  return _redeemOnBase(solanaTxId, evmSigner, callbacks);
}

// ── Shared: VAA poll + Base redeem (steps 2 & 3 of Solana→Base) ──────────────

async function _redeemOnBase(
  solanaTxId: string,
  evmSigner: ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming">,
): Promise<SolanaToEvmTransferResult> {
  const wh = await createWormhole();
  const src = wh.getChain(SOLANA_CHAIN);
  const dst = wh.getChain(EVM_CHAIN);
  const dstNtt = await dst.getProtocol("Ntt", { ntt: getNttContracts(EVM_CHAIN) });

  // ── Step 2: Wait for VAA ─────────────────────────────────────────────────
  callbacks.onAwaitingVaa?.();

  const [whm] = await src.parseTransaction(solanaTxId);
  if (!whm) {
    throw new Error(`Could not parse Wormhole message from Solana tx: ${solanaTxId}`);
  }

  console.log("[Wormhole] Step 2 — waiting for VAA (up to", VAA_TIMEOUT_MS / 60_000, "min)...");
  const vaa = await wh.getVaa(whm, "Ntt:WormholeTransfer", VAA_TIMEOUT_MS);
  if (!vaa) {
    throw new Error(
      `VAA not available within ${VAA_TIMEOUT_MS / 60_000} min. ` +
      `Check: https://wormholescan.io/#/tx/${solanaTxId}?network=Mainnet`,
    );
  }
  console.log("[Wormhole] Step 2 complete — VAA received");

  // ── Step 3: Redeem on Base ────────────────────────────────────────────────
  callbacks.onRedeeming?.();

  const alreadyExecuted = await dstNtt.getIsExecuted(vaa);
  if (alreadyExecuted) {
    console.log("[Wormhole] Step 3 — VAA already executed by relayer, skipping redeem");
    return { solanaTxId, baseTxHash: "" };
  }

  const redeemTxs = dstNtt.redeem([vaa], toNative(EVM_CHAIN, evmSigner.address()));
  const redeemTxids = await signSendWait(dst, redeemTxs, evmSigner);
  const baseTxHash = redeemTxids[redeemTxids.length - 1]!.txid;
  console.log("[Wormhole] Step 3 complete — Base txids:", redeemTxids.map((t) => t.txid));

  console.log("[Wormhole] Transfer complete", { solanaTxId, baseTxHash });
  return { solanaTxId, baseTxHash };
}

// ── Resume Solana → Base from an existing Solana tx ──────────────────────────

export interface ResumeSolanaToEvmParams {
  /** Solana tx signature (base58) or a Solscan URL containing it */
  solanaTxIdOrUrl: string;
  evmSigner: ThirdwebEvmSigner<typeof WORMHOLE_NETWORK>;
}

function extractSolanaTxId(input: string): string {
  // Accept raw base58 signature or a Solscan URL like:
  // https://solscan.io/tx/5Ejwx1xqB1RBM8pY...
  const match = input.match(/[1-9A-HJ-NP-Za-km-z]{87,88}/);
  if (match) return match[0];
  throw new Error(`Could not extract a Solana tx signature from: "${input}"`);
}

/**
 * Resumes a Solana → Base transfer that completed step 1 (lock) but got stuck.
 * Parses the Wormhole message from the existing Solana tx, polls for the VAA,
 * then redeems on Base.
 */
export function resumeSolanaToEvm(
  params: ResumeSolanaToEvmParams,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming"> = {},
): ResultAsync<SolanaToEvmTransferResult, AppError<"WormholeBridge">> {
  return ResultAsync.fromPromise(
    _resumeSolanaToEvm(params, callbacks),
    (error) => {
      console.error("[Wormhole] Resume failed:", error);
      return createAppError(
        error instanceof Error ? error.message : "Wormhole resume failed",
        {
          domain: "WormholeBridge",
          code: "WormholeTransferError",
          cause: error,
          context: { solanaTxIdOrUrl: params.solanaTxIdOrUrl },
        },
      );
    },
  );
}

async function _resumeSolanaToEvm(
  params: ResumeSolanaToEvmParams,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming">,
): Promise<SolanaToEvmTransferResult> {
  const solanaTxId = extractSolanaTxId(params.solanaTxIdOrUrl);
  console.log("[Wormhole] Resuming Solana→Base from tx:", solanaTxId);
  const result = await _redeemOnBase(solanaTxId, params.evmSigner, callbacks);
  console.log("[Wormhole] Resume complete", result);
  return result;
}

/**
 * Base → Solana (P2P ERC20 → P2P SPL) via Wormhole NTT.
 *   1. Burn ERC20 tokens on Base (burning mode)
 *   2. Wormhole guardians sign a VAA (~10-15 min on mainnet)
 *   3. Release SPL tokens from the Solana NTT manager (locking mode)
 */
export function transferEvmToSolana(
  params: EvmToSolanaTransferParams,
  callbacks: WormholeTransferCallback = {},
): ResultAsync<EvmToSolanaTransferResult, AppError<"WormholeBridge">> {
  return ResultAsync.fromPromise(
    _transferEvmToSolana(params, callbacks),
    (error) => {
      console.error("[Wormhole] Transfer failed:", error);
      return createAppError(
        error instanceof Error ? error.message : "Wormhole transfer failed",
        {
          domain: "WormholeBridge",
          code: "WormholeTransferError",
          cause: error,
          context: {
            amount: params.amount,
            recipient: params.recipientSolanaAddress,
          },
        },
      );
    },
  );
}

async function _transferEvmToSolana(
  params: EvmToSolanaTransferParams,
  callbacks: WormholeTransferCallback,
): Promise<EvmToSolanaTransferResult> {
  const { evmSigner, solanaSigner } = params;

  console.log("[Wormhole] Starting Base→Solana transfer", {
    amount: params.amount,
    recipient: params.recipientSolanaAddress,
    evmAddress: evmSigner.address(),
    solanaAddress: solanaSigner.address(),
  });

  const wh = await createWormhole();
  const src = wh.getChain(EVM_CHAIN);   // Base
  const dst = wh.getChain(SOLANA_CHAIN); // Solana

  const srcNtt = await src.getProtocol("Ntt", { ntt: getNttContracts(EVM_CHAIN) });

  // Use EVM token decimals for amount parsing (Base side burns)
  const decimals = await srcNtt.getTokenDecimals();
  const transferAmount = amount.units(amount.parse(params.amount, decimals));

  const dstAddr = {
    chain: SOLANA_CHAIN,
    address: toUniversal(SOLANA_CHAIN, params.recipientSolanaAddress),
  };

  // ── Step 1: Burn on Base ──────────────────────────────────────────────────
  const transferTxs = srcNtt.transfer(
    toNative(EVM_CHAIN, evmSigner.address()),
    transferAmount,
    dstAddr,
    { queue: false, automatic: false },
  );

  const txids = await signSendWait(src, transferTxs, evmSigner);
  const baseTxHash = txids[txids.length - 1]!.txid;
  console.log("[Wormhole] Step 1 complete — Base txids:", txids.map((t) => t.txid));

  callbacks.onLocking?.(txids.map((t) => t.txid));

  return _redeemOnSolana(baseTxHash, solanaSigner, callbacks);
}

// ── Shared: VAA poll + Solana redeem (steps 2 & 3) ───────────────────────────

async function _redeemOnSolana(
  baseTxHash: string,
  solanaSigner: DynamicSolanaSigner<typeof WORMHOLE_NETWORK>,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming">,
): Promise<EvmToSolanaTransferResult> {
  const wh = await createWormhole();
  const src = wh.getChain(EVM_CHAIN);
  const dst = wh.getChain(SOLANA_CHAIN);
  const dstNtt = await dst.getProtocol("Ntt", { ntt: getNttContracts(SOLANA_CHAIN) });

  // ── Step 2: Wait for VAA ─────────────────────────────────────────────────
  callbacks.onAwaitingVaa?.();

  const [whm] = await src.parseTransaction(baseTxHash);
  if (!whm) {
    throw new Error(`Could not parse Wormhole message from Base tx: ${baseTxHash}`);
  }

  console.log("[Wormhole] Step 2 — waiting for VAA (up to", VAA_TIMEOUT_MS / 60_000, "min)...");
  const vaa = await wh.getVaa(whm, "Ntt:WormholeTransfer", VAA_TIMEOUT_MS);
  if (!vaa) {
    throw new Error(
      `VAA not available within ${VAA_TIMEOUT_MS / 60_000} min. ` +
      `Check: https://wormholescan.io/#/tx/${baseTxHash}?network=Mainnet`,
    );
  }
  console.log("[Wormhole] Step 2 complete — VAA received");

  // ── Step 3: Redeem on Solana ──────────────────────────────────────────────
  callbacks.onRedeeming?.();

  const alreadyExecuted = await dstNtt.getIsExecuted(vaa);
  if (alreadyExecuted) {
    console.log("[Wormhole] Step 3 — VAA already executed by relayer, skipping redeem");
    return { baseTxHash, solanaTxId: "" };
  }

  const redeemTxs = dstNtt.redeem([vaa], toNative(SOLANA_CHAIN, solanaSigner.address()));
  const redeemTxids = await signSendWait(dst, redeemTxs, solanaSigner);
  const solanaTxId = redeemTxids[redeemTxids.length - 1]!.txid;
  console.log("[Wormhole] Step 3 complete — Solana txids:", redeemTxids.map((t) => t.txid));

  return { baseTxHash, solanaTxId };
}

// ── Resume Base → Solana from an existing Base tx ────────────────────────────

export interface ResumeEvmToSolanaParams {
  /** Base tx hash (0x…) or a Wormholescan URL containing it */
  baseTxHashOrUrl: string;
  solanaSigner: DynamicSolanaSigner<typeof WORMHOLE_NETWORK>;
}

function extractBaseTxHash(input: string): string {
  const match = input.match(/0x[0-9a-fA-F]{64}/);
  if (match) return match[0];
  throw new Error(`Could not extract a Base tx hash from: "${input}"`);
}

/**
 * Resumes a Base → Solana transfer that completed step 1 (burn) but got stuck.
 * Parses the Wormhole message from the existing Base tx, polls for the VAA,
 * then redeems on Solana.
 */
export function resumeEvmToSolana(
  params: ResumeEvmToSolanaParams,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming"> = {},
): ResultAsync<EvmToSolanaTransferResult, AppError<"WormholeBridge">> {
  return ResultAsync.fromPromise(
    _resumeEvmToSolana(params, callbacks),
    (error) => {
      console.error("[Wormhole] Resume failed:", error);
      return createAppError(
        error instanceof Error ? error.message : "Wormhole resume failed",
        {
          domain: "WormholeBridge",
          code: "WormholeTransferError",
          cause: error,
          context: { baseTxHashOrUrl: params.baseTxHashOrUrl },
        },
      );
    },
  );
}

async function _resumeEvmToSolana(
  params: ResumeEvmToSolanaParams,
  callbacks: Pick<WormholeTransferCallback, "onAwaitingVaa" | "onRedeeming">,
): Promise<EvmToSolanaTransferResult> {
  const baseTxHash = extractBaseTxHash(params.baseTxHashOrUrl);
  console.log("[Wormhole] Resuming Base→Solana from tx:", baseTxHash);
  const result = await _redeemOnSolana(baseTxHash, params.solanaSigner, callbacks);
  console.log("[Wormhole] Resume complete", result);
  return result;
}
