import { ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import {
  prepareGetUserStakeArgs,
  prepareP2pBoostClaimUnstakeTx,
  prepareP2pBoostRequestUnstakeTx,
  prepareP2pBoostStakeTx,
  prepareP2pBoostTopUpTx,
} from "@/core/p2pdotme/contracts";
import type { P2PError, P2PErrorDomain } from "@/core/p2pdotme/shared";
import { createAppError, parseContractError } from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { chain } from "../chain";
import {
  estimatedPrepareTransaction,
  type ThirdwebAdapterError,
  thirdwebClient,
  viemPublicClient,
} from "../client";

// READ OPERATIONS - Using readContract with function signatures
export const getUserStake = (params: {
  user: Address;
}): ResultAsync<
  {
    stakedAmount: bigint;
    cooldownEnd: bigint;
    status: number;
  },
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareGetUserStakeArgs(params).asyncAndThen(
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
            "Failed to read user stake from contract",
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

export const p2pBoostStake = (
  params: { tokens: bigint },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareP2pBoostStakeTx(params)
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
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm p2pBoostStake transaction",
            ),
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

export const p2pBoostTopUp = (
  params: { tokens: bigint },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareP2pBoostTopUpTx(params)
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
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm p2pBoostTopUp transaction",
            ),
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

export const p2pBoostRequestUnstake = (
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareP2pBoostRequestUnstakeTx()
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
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm p2pBoostRequestUnstake transaction",
            ),
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

export const p2pBoostClaimUnstake = (
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareP2pBoostClaimUnstakeTx()
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
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm p2pBoostClaimUnstake transaction",
            ),
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
