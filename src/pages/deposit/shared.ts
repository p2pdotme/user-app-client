import type { BridgeChain, BridgeToken } from "@/core/rango";

export type DepositStatus =
  | "idle"
  | "preparing"
  | "approval"
  | "swapping"
  | "completed"
  | "failed";

export interface DepositState {
  sourceChain: BridgeChain | null;
  sourceToken: BridgeToken | null;
  amount: string;
  status: DepositStatus;
}

export const DEPOSIT_PROGRESS_STEPS = [
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
