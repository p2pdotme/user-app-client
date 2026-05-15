// PDA derivations for Wormhole Core Bridge, Token Bridge, and our receiver program.
// Ported from p2p-sol-base-bridge/scripts/solana-pdas.ts

import { PublicKey } from "@solana/web3.js";

export function deriveGuardianSetKey(
  coreBridge: PublicKey,
  index: number,
): PublicKey {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("GuardianSet"), buf],
    coreBridge,
  )[0];
}

export function deriveWormholeBridgeDataKey(coreBridge: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("Bridge")],
    coreBridge,
  )[0];
}

export function derivePostedVaaKey(
  coreBridge: PublicKey,
  hash: Buffer,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("PostedVAA"), hash],
    coreBridge,
  )[0];
}

export function deriveTokenBridgeConfig(tokenBridge: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    tokenBridge,
  )[0];
}

export function deriveTokenBridgeCustody(
  mint: PublicKey,
  tokenBridge: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [mint.toBuffer()],
    tokenBridge,
  )[0];
}

export function deriveTokenBridgeCustodySigner(
  tokenBridge: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("custody_signer")],
    tokenBridge,
  )[0];
}

export function deriveForeignEndpoint(
  chainId: number,
  emitter: Buffer,
  tokenBridge: PublicKey,
): PublicKey {
  const chainBuf = Buffer.alloc(2);
  chainBuf.writeUInt16BE(chainId);
  return PublicKey.findProgramAddressSync(
    [chainBuf, emitter],
    tokenBridge,
  )[0];
}

export function deriveClaim(
  emitter: Buffer,
  chainId: number,
  sequence: bigint,
  tokenBridge: PublicKey,
): PublicKey {
  const chainBuf = Buffer.alloc(2);
  chainBuf.writeUInt16BE(chainId);
  const seqBuf = Buffer.alloc(8);
  seqBuf.writeBigUInt64BE(sequence);
  return PublicKey.findProgramAddressSync(
    [emitter, chainBuf, seqBuf],
    tokenBridge,
  )[0];
}

export function deriveProgramConfig(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId,
  )[0];
}
