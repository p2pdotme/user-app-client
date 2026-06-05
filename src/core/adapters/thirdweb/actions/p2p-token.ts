import { ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import { erc20Abi } from "viem";
import {
  CONTRACT_ADDRESSES,
  prepareP2PTokenApproveTx,
  prepareP2PTokenTransferTx,
} from "@/core/p2pdotme/contracts";
import type { P2PError, P2PErrorDomain } from "@/core/p2pdotme/shared";
import { createAppError } from "@/lib/errors";
import {
  estimatedPrepareTransaction,
  thirdwebClient,
  viemPublicClient,
} from "../client";
import type { ThirdwebAdapterError } from "../client";
import { chain } from "../chain";

export const transferP2PToken = (
  params: { address: Address; amount: bigint },
  account: Account,
): ResultAsync<TransactionReceipt, ThirdwebAdapterError | P2PError<P2PErrorDomain>> => {
  return prepareP2PTokenTransferTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({ account, transaction: preppedTx }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to sendAndConfirm P2P token transfer",
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, params },
            },
          ),
      ),
    );
};

export const getP2PTokenAllowance = (params: {
  owner: Address;
  spender: Address;
}): ResultAsync<bigint, ThirdwebAdapterError> => {
  return ResultAsync.fromPromise(
    viemPublicClient.readContract({
      address: CONTRACT_ADDRESSES.P2P_TOKEN,
      abi: erc20Abi,
      functionName: "allowance",
      args: [params.owner, params.spender],
    }),
    (error) =>
      createAppError<"ThirdwebAdapter">(
        "Failed to read P2P token allowance from contract",
        {
          domain: "ThirdwebAdapter",
          code: "TWReadContractError",
          cause: error,
          context: { params },
        },
      ),
  );
};

export const approveP2PToken = (
  params: { spender: Address; amount: bigint },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareP2PTokenApproveTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({ account, transaction: preppedTx }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to sendAndConfirm P2P token approve",
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, params },
            },
          ),
      ),
    );
};
