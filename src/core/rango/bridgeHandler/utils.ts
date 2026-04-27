import { parseUnits } from "viem";
import { rango } from "../sdkWrappers";
import { RangoTxStatus } from "../types";

// Common interface for both DepositState and WithdrawState
type BridgeState = {
  status:
    | "idle"
    | "preparing"
    | "approval"
    | "swapping"
    | "completed"
    | "failed";
};

export const createSwapParams = (
  activeTab: "DEPOSIT" | "WITHDRAW",
  debouncedState: {
    selectedChain: string;
    selectedTokenAddress: string | null;
    selectedTokenDecimals: number;
    amount: string;
    toAddress?: string;
  },
  primaryWalletAddress: string | undefined,
  accountAddress: string | undefined,
) => {
  const isDeposit = activeTab === "DEPOSIT";
  return {
    activeTab,
    fromToken: {
      blockchain: debouncedState.selectedChain,
      address: debouncedState.selectedTokenAddress,
    },
    amount: parseUnits(
      debouncedState.amount,
      isDeposit ? debouncedState.selectedTokenDecimals : 6,
    ).toString(),
    fromAddress: isDeposit
      ? (primaryWalletAddress as string)
      : (accountAddress as string),
    toAddress: isDeposit
      ? (accountAddress as string)
      : (debouncedState.toAddress as string),
  };
};

export const waitForApproval = async <T extends BridgeState>(
  requestId: string,
  approveHash: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
) => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const approvalStatus = await rango.isApproved(requestId, approveHash);
    console.log("[Utils] Approval status:", approvalStatus);

    if (approvalStatus.isApproved) {
      console.log("[Utils] Approval confirmed, ready for swap");
      // Don't change status here - let the calling function handle transition to "swapping"
      return;
    } else if (approvalStatus.txStatus === RangoTxStatus.FAILED) {
      setState((prev) => ({ ...prev, status: "failed" }));
      throw new Error("Approve transaction failed in blockchain");
    } else if (approvalStatus.txStatus === RangoTxStatus.SUCCESS) {
      setState((prev) => ({ ...prev, status: "failed" }));
      throw new Error(
        `Insufficient approve, current amount: ${approvalStatus.currentApprovedAmount}, required amount: ${approvalStatus.requiredApprovedAmount}`,
      );
    }
  }
};

export const trackSwapStatus = async <T extends BridgeState>(
  requestId: string,
  txId: string,
  setState: React.Dispatch<React.SetStateAction<T>>,
  isDeposit: boolean,
) => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const state = await rango.status({
      requestId: requestId,
      txId: txId,
    });

    console.log("[Utils] Swap status:", state);
    if (
      state.status &&
      [RangoTxStatus.FAILED, RangoTxStatus.SUCCESS].includes(state.status)
    ) {
      if (state.status === RangoTxStatus.SUCCESS) {
        console.log(
          `[Utils] ${isDeposit ? "Deposit" : "Withdrawal"} completed successfully`,
        );
        // Set completed status on success
        setState((prev) => ({ ...prev, status: "completed" }));
        return true;
      } else {
        setState((prev) => ({ ...prev, status: "failed" }));
        console.log(`[Utils] ${isDeposit ? "Deposit" : "Withdrawal"} failed`);
        return false;
      }
    }
  }
};
