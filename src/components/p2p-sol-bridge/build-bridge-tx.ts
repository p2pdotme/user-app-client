import {
  getAssociatedTokenAddressSync,
  createApproveInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { WORMHOLE } from "./constants";

async function getAnchorDiscriminator(ixName: string): Promise<Uint8Array> {
  const input = new TextEncoder().encode(`global:${ixName}`);
  const hash = await crypto.subtle.digest("SHA-256", input);
  return new Uint8Array(hash).slice(0, 8);
}

export async function buildBridgeTx({
  amount,
  recipientEvm,
  userPubkey,
  connection,
}: {
  amount: bigint;
  recipientEvm: string;
  userPubkey: PublicKey;
  connection: Connection;
}): Promise<Transaction> {
  const SENDER_PROGRAM_ID = new PublicKey(WORMHOLE.SENDER_PROGRAM_ID);
  const SPL_P2P_MINT = new PublicKey(WORMHOLE.SPL_P2P_MINT);
  const SOL_CORE_BRIDGE = new PublicKey(WORMHOLE.SOL_CORE_BRIDGE);
  const SOL_TOKEN_BRIDGE = new PublicKey(WORMHOLE.SOL_TOKEN_BRIDGE);

  // Convert 0x EVM address → 32-byte buffer (12 zero-pad + 20 addr bytes)
  const evmHex = recipientEvm.toLowerCase().replace(/^0x/, "");
  const recipientBytes32 = new Uint8Array(32);
  const evmBytes = Buffer.from(evmHex, "hex");
  recipientBytes32.set(evmBytes, 12);

  // Derive PDAs
  const [senderConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    SENDER_PROGRAM_ID,
  );
  const [senderSenderPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("sender")],
    SENDER_PROGRAM_ID,
  );
  const userToken = getAssociatedTokenAddressSync(SPL_P2P_MINT, userPubkey);

  const [tbConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    SOL_TOKEN_BRIDGE,
  );
  const [tbCustody] = PublicKey.findProgramAddressSync(
    [SPL_P2P_MINT.toBuffer()],
    SOL_TOKEN_BRIDGE,
  );
  const [tbAuthSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority_signer")],
    SOL_TOKEN_BRIDGE,
  );
  const [tbCustodySigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("custody_signer")],
    SOL_TOKEN_BRIDGE,
  );
  const [whBridge] = PublicKey.findProgramAddressSync(
    [Buffer.from("Bridge")],
    SOL_CORE_BRIDGE,
  );
  const [whEmitter] = PublicKey.findProgramAddressSync(
    [Buffer.from("emitter")],
    SOL_TOKEN_BRIDGE,
  );
  const [whSequence] = PublicKey.findProgramAddressSync(
    [Buffer.from("Sequence"), whEmitter.toBuffer()],
    SOL_CORE_BRIDGE,
  );
  const [whFeeCollector] = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_collector")],
    SOL_CORE_BRIDGE,
  );

  // Ephemeral Wormhole message keypair — partial-signs once, then discarded
  const whMessage = Keypair.generate();

  // Instruction data: disc(8) | nonce u32 LE(4) | amount u64 LE(8) | recipient bytes32(32)
  const disc = await getAnchorDiscriminator("bridge_to_base");
  const data = Buffer.alloc(8 + 4 + 8 + 32);
  Buffer.from(disc).copy(data, 0);
  data.writeUInt32LE(Math.floor(Math.random() * 0xffffffff), 8);
  data.writeBigUInt64LE(amount, 12);
  Buffer.from(recipientBytes32).copy(data, 20);

  // Approve: delegate `amount` of SPL P2P to the TB authority signer
  const approveIx = createApproveInstruction(
    userToken,
    tbAuthSigner,
    userPubkey,
    amount,
  );

  // bridge_to_base: account order MUST match Anchor BridgeToBase struct exactly
  const bridgeIx = new TransactionInstruction({
    programId: SENDER_PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: senderConfig, isSigner: false, isWritable: false },
      { pubkey: senderSenderPda, isSigner: false, isWritable: false },
      { pubkey: SPL_P2P_MINT, isSigner: false, isWritable: true },
      { pubkey: userToken, isSigner: false, isWritable: true },
      { pubkey: tbConfig, isSigner: false, isWritable: true },
      { pubkey: tbCustody, isSigner: false, isWritable: true },
      { pubkey: tbAuthSigner, isSigner: false, isWritable: false },
      { pubkey: tbCustodySigner, isSigner: false, isWritable: false },
      { pubkey: whBridge, isSigner: false, isWritable: true },
      { pubkey: whMessage.publicKey, isSigner: true, isWritable: true },
      { pubkey: whEmitter, isSigner: false, isWritable: false },
      { pubkey: whSequence, isSigner: false, isWritable: true },
      { pubkey: whFeeCollector, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SOL_CORE_BRIDGE, isSigner: false, isWritable: false },
      { pubkey: SOL_TOKEN_BRIDGE, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(approveIx).add(bridgeIx);
  tx.feePayer = userPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  // Partial-sign with the ephemeral message keypair first
  tx.partialSign(whMessage);

  return tx;
}
