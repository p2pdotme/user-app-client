import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, type Hex } from "viem";
import { createP2PError, type P2PError } from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareP2PTokenTransferTx(params: {
  address: Address;
  amount: bigint;
}): Result<{ to: Address; data: Hex }, P2PError> {
  return Result.fromThrowable(
    () => ({
      to: CONTRACT_ADDRESSES.P2P_TOKEN,
      data: encodeFunctionData({
        abi: ABIS.EXTERNAL.USDC, // erc20Abi — same for any ERC20
        functionName: "transfer",
        args: [params.address, params.amount],
      }),
    }),
    (error) =>
      createP2PError("Failed to prepare P2P token transfer transaction", {
        domain: "p2p-token",
        code: "P2PPrepareFunctionCallError",
        cause: error,
        context: {
          operation: "prepareP2PTokenTransferTx",
          timestamp: Math.floor(Date.now() / 1000),
          params: { address: params.address, amount: params.amount.toString() },
        },
      }),
  )();
}
