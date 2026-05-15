/**
 * postVaa — posts a signed Wormhole VAA to the Solana core bridge.
 *
 * Ported from @certusone/wormhole-sdk (sendAndConfirmPostVaa.js +
 * wormhole/instructions/verifySignature.js + utils/secp256k1.js).
 *
 * Steps:
 *  1. Parse VAA to get guardian signatures + body hash.
 *  2. Fetch guardian set from Solana to get guardian Ethereum addresses.
 *  3. For each batch of 7 signatures, build a transaction:
 *       [Secp256k1Instruction, verifySignatures instruction]
 *     signed by both the user wallet and the signatureSet keypair.
 *  4. Build + submit a final post_vaa instruction signed by the user wallet.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Secp256k1Program,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { ParsedVaa } from "./parse-vaa";

async function confirmSolanaTx(connection: Connection, sig: string, timeoutMs = 180_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await connection.getSignatureStatuses([sig], { searchTransactionHistory: true });
    const status = value[0];
    if (status?.err) throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") return;
    await new Promise<void>((r) => setTimeout(r, 3000));
  }
  throw new Error(`Not confirmed after ${timeoutMs / 1000}s — sig: ${sig}`);
}
import {
  deriveGuardianSetKey,
  derivePostedVaaKey,
  deriveWormholeBridgeDataKey,
} from "./solana-pdas";

const ETHEREUM_KEY_LENGTH = 20;
const SIGNATURE_LENGTH = 65;
const MAX_GUARDIAN_KEYS = 19;
const BATCH_SIZE = 7;

// ── Guardian set parsing ──────────────────────────────────────────────────────

async function fetchGuardianKeys(
  connection: Connection,
  coreBridge: PublicKey,
  guardianSetIndex: number,
): Promise<Buffer[]> {
  const key = deriveGuardianSetKey(coreBridge, guardianSetIndex);

  // Retry up to 5 times — public devnet RPC often returns 503
  let info = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      info = await connection.getAccountInfo(key, "confirmed");
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === 5) throw new Error(`GuardianSet fetch failed after 5 attempts: ${msg}`);
      console.warn(`[postVaa] getAccountInfo attempt ${attempt} failed (${msg}), retrying…`);
      await new Promise<void>((r) => setTimeout(r, 2000 * attempt));
    }
  }
  if (!info) throw new Error(`GuardianSet account ${key} not found`);

  const data = info.data;
  // Layout (from certusone wormhole-sdk GuardianSetData.deserialize):
  // index: u32 LE (4)
  // keysLen: u32 LE (4)
  // keys: [[u8;20]] x keysLen
  const keysLen = data.readUInt32LE(4);
  const keys: Buffer[] = [];
  for (let i = 0; i < keysLen; i++) {
    keys.push(
      Buffer.from(data.subarray(8 + i * ETHEREUM_KEY_LENGTH, 8 + (i + 1) * ETHEREUM_KEY_LENGTH)),
    );
  }
  return keys;
}

// ── Secp256k1 instruction ─────────────────────────────────────────────────────

function createSecp256k1Instruction(
  signatures: Buffer[],
  keys: Buffer[],
  message: Buffer, // 32-byte hash
): TransactionInstruction {
  if (signatures.length !== keys.length) throw new Error("sig/key mismatch");
  if (message.length !== 32) throw new Error("message must be 32 bytes");

  const numSigs = signatures.length;
  const offsetSpan = 11;
  const dataLen = SIGNATURE_LENGTH + ETHEREUM_KEY_LENGTH; // 85
  const dataLoc = 1 + numSigs * offsetSpan;
  const messageDataOffset = dataLoc + numSigs * dataLen;

  const buf = Buffer.alloc(messageDataOffset + 32);
  buf.writeUInt8(numSigs, 0);
  // Write message at end
  message.copy(buf, messageDataOffset);

  for (let i = 0; i < numSigs; i++) {
    const sigOffset = dataLoc + dataLen * i;
    const ethOffset = sigOffset + SIGNATURE_LENGTH;

    buf.writeUInt16LE(sigOffset, 1 + i * offsetSpan);
    buf.writeUInt8(0, 3 + i * offsetSpan);
    buf.writeUInt16LE(ethOffset, 4 + i * offsetSpan);
    buf.writeUInt8(0, 6 + i * offsetSpan);
    buf.writeUInt16LE(messageDataOffset, 7 + i * offsetSpan);
    buf.writeUInt16LE(32, 9 + i * offsetSpan);
    buf.writeUInt8(0, 11 + i * offsetSpan);

    signatures[i].copy(buf, sigOffset);
    keys[i].copy(buf, ethOffset);
  }

  return {
    keys: [],
    programId: Secp256k1Program.programId,
    data: buf,
  };
}

// ── verify_signatures instruction ────────────────────────────────────────────

async function createVerifySignaturesInstruction(
  coreBridge: PublicKey,
  payer: PublicKey,
  parsed: ParsedVaa,
  signatureSet: PublicKey,
  signatureStatus: number[],
): Promise<TransactionInstruction> {
  // Wormhole Core Bridge is Solitaire (NOT Anchor) — discriminator is a single byte index.
  // VerifySignatures = instruction 7.
  // Data: [0x07] + signatureStatus([i8;19]) = 20 bytes
  const data = Buffer.alloc(20);
  data.writeUInt8(7, 0); // instruction index
  for (let i = 0; i < MAX_GUARDIAN_KEYS; i++) {
    data.writeInt8(signatureStatus[i] ?? -1, 1 + i);
  }

  return new TransactionInstruction({
    programId: coreBridge,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      {
        pubkey: deriveGuardianSetKey(coreBridge, parsed.guardianSetIndex),
        isSigner: false,
        isWritable: false,
      },
      { pubkey: signatureSet, isSigner: true, isWritable: true },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ── post_vaa instruction ──────────────────────────────────────────────────────

async function createPostVaaInstruction(
  coreBridge: PublicKey,
  payer: PublicKey,
  parsed: ParsedVaa,
  signatureSet: PublicKey,
): Promise<TransactionInstruction> {
  // Wormhole Core Bridge is Solitaire — discriminator is a single byte.
  // PostVaa = instruction 2.
  // Data: [0x02] + version(1) + guardianSetIndex(4) + timestamp(4) + nonce(4)
  //     + emitterChain(2) + emitterAddress(32) + sequence(8) + consistencyLevel(1)
  //     + payload Vec<u8>: len(4) + data(N)
  const payloadLen = parsed.payload.length;
  const data = Buffer.alloc(1 + 1 + 4 + 4 + 4 + 2 + 32 + 8 + 1 + 4 + payloadLen);
  let off = 0;

  data.writeUInt8(2, off); off += 1; // instruction index
  data.writeUInt8(parsed.version, off); off += 1;
  data.writeUInt32LE(parsed.guardianSetIndex, off); off += 4;
  data.writeUInt32LE(parsed.timestamp, off); off += 4;
  data.writeUInt32LE(parsed.nonce, off); off += 4;
  data.writeUInt16LE(parsed.emitterChain, off); off += 2;
  parsed.emitterAddress.copy(data, off); off += 32;
  data.writeBigUInt64LE(parsed.sequence, off); off += 8;
  data.writeUInt8(parsed.consistencyLevel, off); off += 1;
  data.writeUInt32LE(payloadLen, off); off += 4;
  parsed.payload.copy(data, off);

  return new TransactionInstruction({
    programId: coreBridge,
    keys: [
      {
        pubkey: deriveGuardianSetKey(coreBridge, parsed.guardianSetIndex),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: deriveWormholeBridgeDataKey(coreBridge),
        isSigner: false,
        isWritable: false,
      },
      { pubkey: signatureSet, isSigner: false, isWritable: false },
      {
        pubkey: derivePostedVaaKey(coreBridge, parsed.hash),
        isSigner: false,
        isWritable: true,
      },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ── Main postVaa ──────────────────────────────────────────────────────────────

export async function postVaa(
  connection: Connection,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  coreBridgeId: PublicKey,
  payerAddress: string,
  vaaBytes: Uint8Array,
  parsed: ParsedVaa,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const payer = new PublicKey(payerAddress);
  const signatureSetKp = Keypair.generate();
  const signatureSetPk = signatureSetKp.publicKey;

  // Fetch guardian addresses from chain
  const guardianKeys = await fetchGuardianKeys(
    connection,
    coreBridgeId,
    parsed.guardianSetIndex,
  );

  const sigs = parsed.guardianSignatures;
  console.log("[postVaa] guardianSetIndex:", parsed.guardianSetIndex);
  console.log("[postVaa] guardianKeys count:", guardianKeys.length);
  guardianKeys.forEach((k, i) => console.log(`  key[${i}]:`, k.toString("hex")));
  console.log("[postVaa] signatures count:", sigs.length);
  sigs.forEach((s) => console.log(`  sig[guardianIdx=${s.index}] recoveryId:`, s.signature[64], "r:", s.signature.subarray(0, 4).toString("hex")));
  console.log("[postVaa] message hash:", parsed.hash.toString("hex"));

  // Process in batches of BATCH_SIZE
  for (let batchStart = 0; batchStart < sigs.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(sigs.length, batchStart + BATCH_SIZE);
    const signatureStatus = new Array<number>(MAX_GUARDIAN_KEYS).fill(-1);
    const batchSigs: Buffer[] = [];
    const batchKeys: Buffer[] = [];

    for (let j = 0; j < batchEnd - batchStart; j++) {
      const item = sigs[batchStart + j];
      batchSigs.push(item.signature);
      batchKeys.push(guardianKeys[item.index]);
      signatureStatus[item.index] = j;
    }

    onProgress?.(
      `Verifying signatures (batch ${Math.floor(batchStart / BATCH_SIZE) + 1})…`,
    );

    const secp256k1Ix = createSecp256k1Instruction(batchSigs, batchKeys, parsed.hash);
    const verifyIx = await createVerifySignaturesInstruction(
      coreBridgeId,
      payer,
      parsed,
      signatureSetPk,
      signatureStatus,
    );

    const tx = new Transaction().add(secp256k1Ix).add(verifyIx);
    tx.feePayer = payer;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // signatureSet keypair must co-sign
    tx.partialSign(signatureSetKp);
    const signed = await signTransaction(tx);
    // skipPreflight=true — devnet simulation often returns stale/wrong state
    // giving false 0x4 errors; the actual on-chain execution succeeds.
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: true,
      maxRetries: 5,
    });
    console.log("[postVaa] batch tx sent:", sig);
    await confirmSolanaTx(connection, sig);
  }

  // Final post_vaa transaction
  onProgress?.("Posting VAA to Solana core bridge…");
  const postVaaIx = await createPostVaaInstruction(
    coreBridgeId,
    payer,
    parsed,
    signatureSetPk,
  );

  const postTx = new Transaction().add(postVaaIx);
  postTx.feePayer = payer;
  postTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signedPost = await signTransaction(postTx);
  const postSig = await connection.sendRawTransaction(signedPost.serialize(), {
    skipPreflight: false,
    maxRetries: 5,
  });
  await confirmSolanaTx(connection, postSig);
}
