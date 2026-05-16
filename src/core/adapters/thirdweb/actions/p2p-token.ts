import { ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import { prepareP2PTokenTransferTx } from "@/core/p2pdotme/contracts";
import type { P2PError, P2PErrorDomain } from "@/core/p2pdotme/shared";
import { createAppError } from "@/lib/errors";
import { thirdwebClient, estimatedPrepareTransaction } from "../client";
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
