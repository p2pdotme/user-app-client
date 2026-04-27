import {
  type AcceptOrderParams,
  type CheckCircleEligibilityParams,
  type CompleteOrderParams,
  type P2PError,
  type P2PErrorDomain,
  type PlaceOrderParams,
  prepareAcceptOrderTx,
  prepareAdminSettleDisputeTx,
  prepareAssignMerchantsTx,
  prepareCancelOrderTx,
  prepareCheckCircleEligibilityArgs,
  prepareCompleteOrderTx,
  prepareFailSafeTx,
  prepareFetchMerchantAcceptedOrdersArgs,
  prepareFetchMerchantAssignedOrdersArgs,
  prepareGetAdditionalOrderDetailsArgs,
  prepareGetExchangeFiatBalanceArgs,
  prepareGetMerchantRiskCategoryArgs,
  prepareGetOrderAssignedMerchantsArgs,
  prepareGetOrderByIdArgs,
  prepareGetOrderCashbackArgs,
  prepareGetOrderExpiryArgs,
  prepareGetOrderFixedFeePaidArgs,
  prepareGetRPPerUsdLimitArgs,
  prepareGetSmallOrderFixedFeeArgs,
  prepareGetSmallOrderThresholdArgs,
  prepareGetTxLimitArgs,
  prepareGetUserArgs,
  prepareGetUserBuyLimitArgs,
  prepareGetUserOrderArrArgs,
  prepareGetUserSellLimitArgs,
  preparePaidBuyOrderTx,
  preparePlaceOrderTx,
  prepareRaiseDisputeTx,
  prepareReduceExchangeFiatBalanceTx,
  prepareReleaseMerchantFundsTx,
  prepareReleaseRevenueShareTx,
  prepareSellOrderUserCompletedTx,
  prepareSetReputationManagerTx,
  prepareSetSellOrderUpiTx,
  prepareTipMerchantTx,
  prepareUpdateRpPerUsdtLimitTx,
  type RaiseDisputeParams,
  type ReduceExchangeFiatBalanceParams,
  type ReleaseMerchantFundsParams,
  type ReleaseRevenueShareParams,
  type SetSellOrderUpiParams,
  type TipMerchantParams,
  type UpdateRpPerUsdtLimitParams,
} from "@p2pdotme";
import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import { createAppError, parseContractError } from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { chain } from "../chain";
import {
  estimatedPrepareTransaction,
  type ThirdwebAdapterError,
  thirdwebClient,
  viemPublicClient,
} from "../client";
import { OrderSchema, validateBeforeUse } from "../validation";

// READ OPERATIONS - Using readContract with function signatures

export function getTxLimit(params: {
  address: Address;
  currency: CurrencyType;
}) {
  return prepareGetTxLimitArgs(params).asyncAndThen(
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
            "Failed to read tx limit from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUserBuyLimit(params: {
  address: Address;
  currency: CurrencyType;
}) {
  return prepareGetUserBuyLimitArgs(params).asyncAndThen(
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
            "Failed to read user buy limit from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUserSellLimit(params: {
  address: Address;
  currency: CurrencyType;
}) {
  return prepareGetUserSellLimitArgs(params).asyncAndThen(
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
            "Failed to read user sell limit from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getMerchantRiskCategory(params: { merchantAddress: Address }) {
  return prepareGetMerchantRiskCategoryArgs(params).asyncAndThen(
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
            "Failed to read merchant risk category from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUser(params: { address: Address }) {
  return prepareGetUserArgs(params).asyncAndThen(
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
            "Failed to read user from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getExchangeFiatBalance(params: { currency: CurrencyType }) {
  return prepareGetExchangeFiatBalanceArgs(params).asyncAndThen(
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
            "Failed to read exchange fiat balance from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getRPPerUsdLimit(params: { currency: CurrencyType }) {
  return prepareGetRPPerUsdLimitArgs(params).asyncAndThen(
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
            "Failed to read RP per USD limit from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getOrderById(params: { orderId: number }) {
  return prepareGetOrderByIdArgs(params).asyncAndThen(
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
            "Failed to read order by ID from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ).andThen((order) => validateBeforeUse(OrderSchema, order)),
  );
}

export function getUserOrdersArr(params: { address: Address }) {
  return prepareGetUserOrderArrArgs(params).asyncAndThen(
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
            "Failed to read user orders array from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getOrderExpiry() {
  return prepareGetOrderExpiryArgs().asyncAndThen(
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
            "Failed to read order expiry from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getOrderAssignedMerchants(params: {
  orderId: number;
  merchant: Address;
}) {
  return prepareGetOrderAssignedMerchantsArgs(params).asyncAndThen(
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
            "Failed to read order assigned merchants from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function fetchMerchantAcceptedOrders(params: { merchant: Address }) {
  return prepareFetchMerchantAcceptedOrdersArgs(params).asyncAndThen(
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
            "Failed to fetch merchant accepted orders from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function fetchMerchantAssignedOrders(params: { merchant: Address }) {
  return prepareFetchMerchantAssignedOrdersArgs(params).asyncAndThen(
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
            "Failed to fetch merchant assigned orders from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getSmallOrderThreshold(params: { currency: CurrencyType }) {
  return prepareGetSmallOrderThresholdArgs(params).asyncAndThen(
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
            "Failed to read small order threshold from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getSmallOrderFixedFee(params: { currency: CurrencyType }) {
  return prepareGetSmallOrderFixedFeeArgs(params).asyncAndThen(
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
            "Failed to read small order fixed fee from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getOrderFixedFeePaid(params: { orderId: number }) {
  return prepareGetOrderFixedFeePaidArgs(params).asyncAndThen(
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
            "Failed to read order fixed fee paid from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getAdditionalOrderDetails(params: { orderId: number }) {
  return prepareGetAdditionalOrderDetailsArgs(params).asyncAndThen(
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
            "Failed to read additional order details from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getOrderCashback(params: { orderId: number }) {
  return prepareGetOrderCashbackArgs(params).asyncAndThen(
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
            "Failed to read order cashback from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function checkCircleEligibility(
  params: CheckCircleEligibilityParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError<P2PErrorDomain>> {
  return prepareCheckCircleEligibilityArgs(params).asyncAndThen(
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
            "Failed to check circle eligibility from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ).map((merchants) => merchants.length >= 1),
  );
}

// WRITE OPERATIONS - Using sendAndConfirmTransaction

export const placeOrder = (
  params: PlaceOrderParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return preparePlaceOrderTx(params)
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
                "Failed to sendAndConfirm placeOrder transaction",
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

export const acceptOrder = (
  params: AcceptOrderParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareAcceptOrderTx(params)
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
                "Failed to sendAndConfirm acceptOrder transaction",
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

export const paidBuyOrder = (
  params: { orderId: number },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return preparePaidBuyOrderTx(params)
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
                "Failed to sendAndConfirm paidBuyOrder transaction",
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

export const completeOrder = (
  params: CompleteOrderParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareCompleteOrderTx(params)
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
                "Failed to sendAndConfirm completeOrder transaction",
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

export const cancelOrder = (
  params: { orderId: number },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareCancelOrderTx(params)
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
                "Failed to sendAndConfirm cancelOrder transaction",
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

export const assignMerchants = (
  params: { orderId: number },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareAssignMerchantsTx(params)
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
                "Failed to sendAndConfirm assignMerchants transaction",
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

export const sellOrderUserCompleted = (
  params: { orderId: number },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareSellOrderUserCompletedTx(params)
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
                "Failed to sendAndConfirm sellOrderUserCompleted transaction",
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

export const setSellOrderUpi = (
  params: SetSellOrderUpiParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareSetSellOrderUpiTx(params)
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
                "Failed to sendAndConfirm setSellOrderUpi transaction",
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

export const adminSettleDispute = (
  params: { orderId: number },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareAdminSettleDisputeTx(params)
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
                "Failed to sendAndConfirm adminSettleDispute transaction",
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

export const failSafe = (
  params: { amount: bigint },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareFailSafeTx(params)
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
                "Failed to sendAndConfirm failSafe transaction",
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

export const raiseDispute = (
  params: RaiseDisputeParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareRaiseDisputeTx(params)
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
                "Failed to sendAndConfirm raiseDispute transaction",
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

export const reduceExchangeFiatBalance = (
  params: ReduceExchangeFiatBalanceParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareReduceExchangeFiatBalanceTx(params)
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
                "Failed to sendAndConfirm reduceExchangeFiatBalance transaction",
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

export const releaseMerchantFunds = (
  params: ReleaseMerchantFundsParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareReleaseMerchantFundsTx(params)
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
                "Failed to sendAndConfirm releaseMerchantFunds transaction",
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

export const releaseRevenueShare = (
  params: ReleaseRevenueShareParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareReleaseRevenueShareTx(params)
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
                "Failed to sendAndConfirm releaseRevenueShare transaction",
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

export const setReputationManager = (
  params: { addr: Address },
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareSetReputationManagerTx(params)
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
                "Failed to sendAndConfirm setReputationManager transaction",
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

export const updateRpPerUsdtLimit = (
  params: UpdateRpPerUsdtLimitParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUpdateRpPerUsdtLimitTx(params)
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
                "Failed to sendAndConfirm updateRpPerUsdtLimit transaction",
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

export const tipMerchant = (
  params: TipMerchantParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareTipMerchantTx(params)
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
                "Failed to sendAndConfirm tipMerchant transaction",
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
