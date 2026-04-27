import { PublicKey } from "@solana/web3.js";
import { isAddress } from "viem";
import type {
  BridgeChain,
  BridgeToken,
  SupportedBridgeChains,
} from "@/core/rango";

export type WithdrawStatus =
  | "idle"
  | "preparing"
  | "approval"
  | "swapping"
  | "completed"
  | "failed";

export interface WithdrawState {
  destinationChain: BridgeChain | null;
  destinationToken: BridgeToken | null;
  amount: string;
  recipientAddress: string;
  status: WithdrawStatus;
}

export const WITHDRAW_PROGRESS_STEPS = [
  {
    key: "approval",
    activeTextKey: "APPROVING",
    completedTextKey: "APPROVED",
  },
  {
    key: "swapping",
    activeTextKey: "SWAPPING",
    completedTextKey: "SWAPPED",
  },
] as const;

export const isValidAddressForChain = (
  chain: SupportedBridgeChains,
  address: string,
) => {
  if (chain === "SOLANA") {
    try {
      return PublicKey.isOnCurve(new PublicKey(address).toBuffer());
    } catch (error) {
      console.warn(error);
      return false;
    }
  } else {
    return isAddress(address);
  }
};
