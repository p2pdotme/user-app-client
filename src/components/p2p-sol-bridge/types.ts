export type PendingBridgeStatus =
  | "wormhole_pending"
  | "ready_to_redeem"
  | "redeemed"
  | "failed";

export type PendingBridge = {
  id: string; // same as txSig — unique per transfer
  direction: "solana_to_base";
  txSig: string;
  emitterChain: 1;
  emitter: string; // 64-char hex of TB emitter PDA
  sequence: string; // u64 as string
  amount: string; // raw u64 as string (6 dec)
  recipientEvm: string; // 0x EVM address
  status: PendingBridgeStatus;
  vaaB64?: string; // populated once guardians sign
  redeemTxHash?: string; // populated after Base redeem
  createdAt: number;
};

export type BridgeStep =
  | "idle"
  | "sending"
  | "wormhole_pending"
  | "ready_to_redeem"
  | "redeeming"
  | "completed"
  | "failed";
