// Calls receiver.redeem on Solana to unlock SPL P2P to the recipient ATA.

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { ParsedVaa } from "./parse-vaa";
import {
  deriveClaim,
  deriveForeignEndpoint,
  derivePostedVaaKey,
  deriveProgramConfig,
  deriveTokenBridgeConfig,
  deriveTokenBridgeCustody,
  deriveTokenBridgeCustodySigner,
} from "./solana-pdas";

async function anchorDisc(name: string): Promise<Buffer> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`global:${name}`),
  );
  return Buffer.from(new Uint8Array(hash).slice(0, 8));
}

export async function buildReceiverRedeemTx(
  connection: Connection,
  payer: PublicKey,
  parsed: ParsedVaa,
  coreBridgeId: PublicKey,
  tokenBridgeId: PublicKey,
  receiverId: PublicKey,
  mintPk: PublicKey,
  recipientPk: PublicKey,
): Promise<Transaction> {
  const disc = await anchorDisc("redeem");

  const receiverConfig = deriveProgramConfig(receiverId);
  const [redeemerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("redeemer")],
    receiverId,
  );
  const programToken = getAssociatedTokenAddressSync(mintPk, redeemerPda, true);
  const recipientToken = getAssociatedTokenAddressSync(mintPk, recipientPk);

  const tbConfig = deriveTokenBridgeConfig(tokenBridgeId);
  const postedVaa = derivePostedVaaKey(coreBridgeId, parsed.hash);
  const claim = deriveClaim(
    parsed.emitterAddress,
    parsed.emitterChain,
    parsed.sequence,
    tokenBridgeId,
  );
  const foreignEndpoint = deriveForeignEndpoint(
    parsed.emitterChain,
    parsed.emitterAddress,
    tokenBridgeId,
  );
  const tbCustody = deriveTokenBridgeCustody(mintPk, tokenBridgeId);
  const tbCustodySigner = deriveTokenBridgeCustodySigner(tokenBridgeId);

  // Account order must match Redeem #[derive(Accounts)] in receiver/src/lib.rs
  const ix = new TransactionInstruction({
    programId: receiverId,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: receiverConfig, isSigner: false, isWritable: false },
      { pubkey: redeemerPda, isSigner: false, isWritable: false },
      { pubkey: mintPk, isSigner: false, isWritable: false },
      { pubkey: programToken, isSigner: false, isWritable: true },
      { pubkey: recipientPk, isSigner: false, isWritable: false },
      { pubkey: recipientToken, isSigner: false, isWritable: true },
      { pubkey: tbConfig, isSigner: false, isWritable: false },
      { pubkey: postedVaa, isSigner: false, isWritable: false },
      { pubkey: claim, isSigner: false, isWritable: true },
      { pubkey: foreignEndpoint, isSigner: false, isWritable: false },
      { pubkey: tbCustody, isSigner: false, isWritable: true },
      { pubkey: tbCustodySigner, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: coreBridgeId, isSigner: false, isWritable: false },
      { pubkey: tokenBridgeId, isSigner: false, isWritable: false },
    ],
    data: disc,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = payer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}
