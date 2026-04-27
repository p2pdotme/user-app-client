import { CONTRACT_ADDRESSES } from "@p2pdotme";
import type {
  PlaceOrderParams,
  PreparedTx,
  SetSellOrderUpiParams,
} from "@p2pdotme/sdk/orders";
import { useOrders } from "@p2pdotme/sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ResultAsync } from "neverthrow";
import type { Address } from "thirdweb";
import { sendAndConfirmTransaction } from "thirdweb";
import {
  approveUSDC as approveUSDCtx,
  cancelOrder as cancelOrderTx,
  chain,
  estimatedPrepareTransaction,
  getUSDCAllowance as getUSDCAllowanceTx,
  paidBuyOrder as paidBuyOrderTx,
  thirdwebClient,
  tipMerchant as tipMerchantTx,
} from "@/core/adapters/thirdweb";
import type {
  CancelOrderParams,
  PaidBuyOrderParams,
  TipMerchantParams,
} from "@/core/p2pdotme/shared/validation";
import { useThirdweb } from "@/hooks";
import { createAppError, parseContractError } from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { captureError, withSentrySpan } from "@/lib/sentry";

// ERC-20 maximum allowance value (2^256 - 1), used to approve unlimited USDC allowance
const MAX_UINT256 = 2n ** 256n - 1n;

function submitPreparedTx(
  prepared: PreparedTx,
  account: NonNullable<ReturnType<typeof useThirdweb>["account"]>,
) {
  return estimatedPrepareTransaction({
    from: account.address as Address,
    to: prepared.to,
    chain,
    client: thirdwebClient,
    data: prepared.data,
  }).andThen((preppedTx) =>
    ResultAsync.fromPromise(
      sendAndConfirmTransaction({ account, transaction: preppedTx }),
      (error) =>
        createAppError<"ThirdwebAdapter">(
          i18n.t(
            parseContractError(error) ?? "Failed to sendAndConfirm transaction",
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
}

export function useOrderFlow() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const orders = useOrders();

  // Helper function to check and approve USDC if needed
  const ensureUSDCApproval = () => {
    if (!account) {
      return ResultAsync.fromSafePromise(Promise.resolve(undefined));
    }

    return getUSDCAllowanceTx({
      address: account.address as Address,
      diamondAddress: CONTRACT_ADDRESSES.DIAMOND as Address,
    }).andThen((currentAllowance) => {
      // only approve if the allowance is less than half of the maximum allowance, this is to avoid unnecessary approvals and less gas spent
      if (currentAllowance >= MAX_UINT256 / 2n) {
        console.log(
          "[ensureUSDCApproval] Sufficient allowance already approved:",
          currentAllowance,
        );
        return ResultAsync.fromSafePromise(Promise.resolve(undefined));
      }

      console.log(
        "[ensureUSDCApproval] Approving maximum USDC allowance:",
        MAX_UINT256,
      );
      return approveUSDCtx(
        {
          address: CONTRACT_ADDRESSES.DIAMOND as Address,
          amount: MAX_UINT256,
        },
        account,
      ).map(() => undefined);
    });
  };

  // PLACE ORDER - Enhanced with Sentry
  const placeOrderMutation = useMutation({
    mutationKey: ["order", "placeOrder"],
    mutationFn: async (params: PlaceOrderParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.place_order",
        "Place Order Transaction",
        async () => {
          console.log("[useOrderFlow] Starting placeOrder flow", {
            orderType: params.orderType,
            amount: params.amount.toString(),
          });

          return ensureUSDCApproval()
            .andThen(() =>
              orders.placeOrder
                .prepare(params)
                .andThen((prepared) => submitPreparedTx(prepared, account)),
            )
            .match(
              (value) => {
                console.log("[useOrderFlow] placeOrder success", value);
                return value;
              },
              (error) => {
                console.error("[useOrderFlow] placeOrder error", error);

                captureError(error, {
                  operation: "place_order",
                  component: "useOrderFlow",
                  userId: account.address,
                  extra: {
                    orderType: params.orderType,
                    amount: params.amount.toString(),
                  },
                });

                throw error;
              },
            );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    },
  });

  // PAID BUY ORDER - Enhanced with Sentry
  const paidBuyOrderMutation = useMutation({
    mutationKey: ["order", "paidBuyOrder"],
    mutationFn: async (params: PaidBuyOrderParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.paid_buy_order",
        "Mark Order as Paid",
        async () => {
          return paidBuyOrderTx(params, account).match(
            (value) => {
              console.log("[useOrderFlow] paidBuyOrder success", value);
              return value;
            },
            (error) => {
              console.error("[useOrderFlow] paidBuyOrder error", error);

              captureError(error, {
                operation: "paid_buy_order",
                component: "useOrderFlow",
                userId: account.address,
                extra: {
                  orderId: params.orderId.toString(),
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    },
  });

  // SET SELL ORDER UPI - Enhanced with Sentry
  const setSellOrderUpiMutation = useMutation({
    mutationKey: ["order", "setSellOrderUpi"],
    mutationFn: async (params: SetSellOrderUpiParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.set_sell_order_upi",
        "Set Sell Order UPI",
        async () => {
          return ensureUSDCApproval()
            .andThen(() =>
              orders.setSellOrderUpi
                .prepare(params)
                .andThen((prepared) => submitPreparedTx(prepared, account)),
            )
            .match(
              (value) => {
                console.log("[useOrderFlow] setSellOrderUpi success", value);
                return value;
              },
              (error) => {
                console.error("[useOrderFlow] setSellOrderUpi error", error);

                captureError(error, {
                  operation: "set_sell_order_upi",
                  component: "useOrderFlow",
                  userId: account.address,
                  extra: {
                    orderId: params.orderId.toString(),
                    updatedAmount: params.updatedAmount.toString(),
                  },
                });

                throw error;
              },
            );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    },
  });

  // Cancel Order - Enhanced with Sentry
  const cancelOrderMutation = useMutation({
    mutationKey: ["order", "cancelOrder"],
    mutationFn: async (params: CancelOrderParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.cancel_order",
        "Cancel Order",
        async () => {
          return cancelOrderTx(params, account).match(
            (value) => {
              console.log("[useOrderFlow] cancelOrder success", value);
              return value;
            },
            (error) => {
              console.error("[useOrderFlow] cancelOrder error", error);

              captureError(error, {
                operation: "cancel_order",
                component: "useOrderFlow",
                userId: account.address,
                extra: {
                  orderId: params.orderId.toString(),
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    },
  });

  // Tip Merchant - Enhanced with Sentry
  const tipMerchantMutation = useMutation({
    mutationKey: ["order", "tipMerchant"],
    mutationFn: async (params: TipMerchantParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.tip_merchant",
        "Tip Merchant",
        async () => {
          return ensureUSDCApproval()
            .andThen(() => tipMerchantTx(params, account))
            .match(
              (value) => {
                console.log("[useOrderFlow] tipMerchant success", value);
                return value;
              },
              (error) => {
                console.error("[useOrderFlow] tipMerchant error", error);

                captureError(error, {
                  operation: "tip_merchant",
                  component: "useOrderFlow",
                  userId: account.address,
                  extra: {
                    orderId: params.orderId.toString(),
                    tipAmount: params.tipAmount.toString(),
                  },
                });

                throw error;
              },
            );
        },
      );
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
      queryClient.invalidateQueries({
        queryKey: ["order", "tip", params.orderId],
      });
    },
  });

  return {
    placeOrderMutation,
    paidBuyOrderMutation,
    setSellOrderUpiMutation,
    cancelOrderMutation,
    tipMerchantMutation,
  };
}
