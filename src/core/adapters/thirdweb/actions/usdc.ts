import {
  type P2PError,
  type P2PErrorDomain,
  prepareGetUSDCAllowanceArgs,
  prepareGetUSDCBalanceArgs,
  prepareUSDCApproveTx,
  prepareUSDCTransferTx,
  type USDCApproveParams,
  type USDCTransferParams,
} from "@p2pdotme";
import { ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import { createAppError } from "@/lib/errors";
import { chain } from "../chain";
import {
  estimatedPrepareTransaction,
  type ThirdwebAdapterError,
  thirdwebClient,
  viemPublicClient,
} from "../client";

// READ OPERATIONS - Using readContract with function signatures
export function getUSDCBalance(
  address: Address,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetUSDCBalanceArgs({ address }).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read USDC balance from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { address, to, args },
            },
          ),
      ),
  );
}

export const getUSDCAllowance = (params: {
  address: Address;
  diamondAddress: Address;
}): ResultAsync<bigint, ThirdwebAdapterError | P2PError<P2PErrorDomain>> => {
  return prepareGetUSDCAllowanceArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read USDC allowance from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
};

// WRITE OPERATIONS - Using sendAndConfirmTransaction
export const transferUSDC = (
  params: USDCTransferParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUSDCTransferTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to sendAndConfirm USDC transfer transaction",
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const approveUSDC = (
  params: USDCApproveParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUSDCApproveTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to sendAndConfirm USDC approve transaction",
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};
