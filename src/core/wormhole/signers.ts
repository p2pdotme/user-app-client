import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import type { SignAndSendSigner, Network, TxHash } from "@wormhole-foundation/sdk";
import type { SolanaUnsignedTransaction, } from "@wormhole-foundation/sdk-solana";
import type { EvmUnsignedTransaction } from "@wormhole-foundation/sdk-evm";
import type { SolanaWallet } from "@dynamic-labs/solana-core";
import { prepareTransaction, sendTransaction } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import { base as baseChain } from "thirdweb/chains";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { SOLANA_CHAIN, EVM_CHAIN } from "./config";

// ── Solana confirmation poller ─────────────────────────────────────────────────

/**
 * Polls getSignatureStatuses every 3 s until confirmed/finalized or the tx fails.
 * Gives up after 120 s — if still null the tx was definitively dropped.
 */
async function pollConfirmation(connection: Connection, signature: string): Promise<void> {
  const POLL_INTERVAL_MS = 3_000;
  const DEADLINE_MS = 120_000;
  const start = Date.now();

  for (;;) {
    const elapsed = Date.now() - start;

    const { value: statuses } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = statuses?.[0];

    if (status) {
      if (status.err) {
        const msg = `Solana tx ${signature} failed: ${JSON.stringify(status.err)}`;
        console.error("[SolanaSigner]", msg);
        throw new Error(msg);
      }
      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized") {
        console.log("[SolanaSigner] confirmed:", signature, `(${status.confirmationStatus})`);
        return;
      }
      console.log(
        `[SolanaSigner] ${status.confirmationStatus ?? "processing"} — ${Math.round(elapsed / 1000)}s`,
      );
    } else {
      if (elapsed >= DEADLINE_MS) {
        const msg = `Solana tx ${signature} not confirmed after ${DEADLINE_MS / 1000}s — likely dropped. Please retry.`;
        console.error("[SolanaSigner]", msg);
        throw new Error(msg);
      }
      console.log(`[SolanaSigner] not yet visible — ${Math.round(elapsed / 1000)}s`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// ── Solana signer ─────────────────────────────────────────────────────────────

/**
 * Wraps a Dynamic Labs SolanaWallet as a Wormhole SignAndSendSigner.
 *
 * The Wormhole NTT SDK yields each transaction with an optional `signers` array
 * containing SDK-managed keypairs (e.g. the NTT outbox item) that must co-sign
 * before the user's wallet signs and submits. Skipping this step produces an
 * invalid transaction that validators drop silently.
 */
export class DynamicSolanaSigner<N extends Network>
  implements SignAndSendSigner<N, "Solana">
{
  constructor(private readonly wallet: SolanaWallet) {}

  chain(): "Solana" {
    return SOLANA_CHAIN;
  }

  address(): string {
    return this.wallet.address;
  }

  async signAndSend(txs: SolanaUnsignedTransaction<N>[]): Promise<TxHash[]> {
    const walletSigner = await this.wallet.getSigner();
    const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL, "confirmed");
    const hashes: TxHash[] = [];

    for (const unsignedTx of txs) {
      const { transaction, signers } = unsignedTx.transaction as {
        transaction: unknown;
        signers?: unknown[];
      };

      // The SDK ships its own bundled @solana/web3.js — class-identity mismatches
      // break sign(), partialSign(), and simulate() when called across versions.
      //
      // Fix: for VersionedTransactions, serialize→deserialize converts the SDK
      // object into our web3.js type so our Keypair and sign() work correctly.
      // For legacy Transactions, set missing fields and use partialSign directly.
      const sdkTx = transaction as any;
      const isLegacy = Array.isArray(sdkTx.instructions);

      let normalizedTx: VersionedTransaction | typeof sdkTx = sdkTx;

      if (!isLegacy) {
        try {
          normalizedTx = VersionedTransaction.deserialize(sdkTx.serialize());
        } catch (e) {
          console.warn("[SolanaSigner] serialize/deserialize failed, using raw SDK tx:", e);
        }
      } else {
        // Legacy Transaction: set fields the SDK leaves unset.
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        if (!sdkTx.recentBlockhash) sdkTx.recentBlockhash = blockhash;
        if (!sdkTx.feePayer) sdkTx.feePayer = new PublicKey(this.wallet.address);
      }

      // Co-sign with SDK-provided keypairs (e.g. NTT outbox/inbox item, signature set).
      // Uses our Keypair.fromSecretKey so the types are cross-version compatible.
      const validSigners = (signers ?? []).filter(
        (s) => s != null && (s as any).secretKey instanceof Uint8Array,
      );
      if (validSigners.length > 0) {
        try {
          const keypairs = validSigners.map((s) => Keypair.fromSecretKey((s as any).secretKey));
          if (normalizedTx instanceof VersionedTransaction) {
            normalizedTx.sign(keypairs);
          } else {
            (normalizedTx as any).partialSign(...keypairs);
          }
          console.log(`[SolanaSigner] pre-signed with ${keypairs.length} SDK keypair(s)`);
        } catch (err) {
          console.warn("[SolanaSigner] pre-sign failed (proceeding without):", err);
        }
      }

      // User wallet (Phantom) signs and submits.
      let signature: string;
      try {
        const result = await walletSigner.signAndSendTransaction(
          normalizedTx as Parameters<typeof walletSigner.signAndSendTransaction>[0],
        );
        signature = result.signature;
        console.log("[SolanaSigner] submitted:", signature);
      } catch (err) {
        console.error("[SolanaSigner] signAndSendTransaction failed:", err);
        throw err;
      }

      // Step 3: poll until confirmed/finalized.
      await pollConfirmation(connection, signature);

      hashes.push(signature as TxHash);
    }

    return hashes;
  }
}

// ── EVM signer (thirdweb / Base) ──────────────────────────────────────────────

function resolveAddress(addr: unknown): `0x${string}` | undefined {
  if (addr == null) return undefined;
  if (typeof addr === "string")
    return (addr.startsWith("0x") ? addr : `0x${addr}`) as `0x${string}`;
  return undefined;
}

function toBigInt(value: unknown): bigint | undefined {
  if (value == null) return undefined;
  try {
    return BigInt(value.toString());
  } catch {
    return undefined;
  }
}

function toHexData(data: unknown): `0x${string}` | undefined {
  if (data == null) return undefined;
  if (typeof data === "string") {
    return data.startsWith("0x")
      ? (data as `0x${string}`)
      : (`0x${data}` as `0x${string}`);
  }
  if (data instanceof Uint8Array) {
    return `0x${Buffer.from(data).toString("hex")}` as `0x${string}`;
  }
  return undefined;
}

/**
 * Wraps a thirdweb Account as a Wormhole SignAndSendSigner for Base.
 * Maps ethers TransactionRequest fields to thirdweb's prepareTransaction format.
 */
export class ThirdwebEvmSigner<N extends Network>
  implements SignAndSendSigner<N, "Base">
{
  constructor(private readonly account: Account) {}

  chain(): "Base" {
    return EVM_CHAIN;
  }

  address(): string {
    return this.account.address;
  }

  async signAndSend(txs: EvmUnsignedTransaction<N, "Base">[]): Promise<TxHash[]> {
    const hashes: TxHash[] = [];

    for (const unsignedTx of txs) {
      const ethersTx = unsignedTx.transaction;

      const tx = prepareTransaction({
        chain: baseChain,
        client: thirdwebClient,
        to: resolveAddress(ethersTx.to),
        data: toHexData(ethersTx.data),
        value: toBigInt(ethersTx.value),
        gas: toBigInt(ethersTx.gasLimit),
        maxFeePerGas: toBigInt(ethersTx.maxFeePerGas),
        maxPriorityFeePerGas: toBigInt(ethersTx.maxPriorityFeePerGas),
      });

      try {
        const result = await sendTransaction({ account: this.account, transaction: tx });
        console.log("[EvmSigner] Base tx:", result.transactionHash);
        hashes.push(result.transactionHash as TxHash);
      } catch (err) {
        console.error("[EvmSigner] sendTransaction failed:", err);
        throw err;
      }
    }

    return hashes;
  }
}
