export type OutboundBridgeStatus =
  | "wormhole_pending"
  | "ready_to_redeem"
  | "redeemed"
  | "failed";

export type PendingOutboundBridge = {
  id: string; // EVM tx hash
  evmTxHash: string;
  emitterChain: 10002;
  emitter: string; // 64-char hex
  sequence: string;
  amount: string; // raw units as string
  recipientSolana: string; // base58 Solana address
  status: OutboundBridgeStatus;
  vaaB64?: string;
  redeemTxSig?: string;
  createdAt: number;
};

export type OutboundStep =
  | "idle"
  | "approving"
  | "bridging"
  | "wormhole_pending"
  | "posting_vaa"
  | "redeeming"
  | "completed"
  | "failed";
