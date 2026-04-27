import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, type Hex, stringToHex } from "viem";
import {
  type AcceptOrderParams,
  type CheckCircleEligibilityParams,
  type CompleteOrderParams,
  createP2PError,
  type ExchangeFiatBalanceParams,
  type FetchMerchantAssignedOrdersParams,
  type FetchMerchantOrdersParams,
  type MerchantRiskCategoryParams,
  type OrderActualFiatAmountParams,
  type OrderActualUsdtAmountParams,
  type OrderAdditionalDetailsParams,
  type OrderAssignedMerchantsParams,
  type OrderByIdParams,
  type OrderCashbackParams,
  type OrderFixedFeePaidParams,
  type P2PError,
  type PlaceOrderParams,
  type RaiseDisputeParams,
  type ReduceExchangeFiatBalanceParams,
  type ReleaseMerchantFundsParams,
  type ReleaseRevenueShareParams,
  type RPPerUsdLimitParams,
  type SetSellOrderUpiParams,
  type SmallOrderFixedFeeParams,
  type SmallOrderThresholdParams,
  type TipMerchantParams,
  type TxLimitParams,
  type UpdateRpPerUsdtLimitParams,
  type UserBuyLimitParams,
  type UserParams,
  type UserSellLimitParams,
  validate,
  ZodAcceptOrderParamsSchema,
  ZodAdminSettleDisputeParamsSchema,
  ZodAssignMerchantsParamsSchema,
  ZodCancelOrderParamsSchema,
  ZodCheckCircleEligibilityParamsSchema,
  ZodCompleteOrderParamsSchema,
  ZodExchangeFiatBalanceParamsSchema,
  ZodFailSafeParamsSchema,
  ZodFetchMerchantAssignedOrdersParamsSchema,
  ZodFetchMerchantOrdersParamsSchema,
  ZodMerchantRiskCategoryParamsSchema,
  ZodOrderActualFiatAmountParamsSchema,
  ZodOrderActualUsdtAmountParamsSchema,
  ZodOrderAdditionalDetailsParamsSchema,
  ZodOrderAssignedMerchantsParamsSchema,
  ZodOrderByIdParamsSchema,
  ZodOrderCashbackParamsSchema,
  ZodOrderFixedFeePaidParamsSchema,
  ZodPaidBuyOrderParamsSchema,
  ZodPlaceOrderParamsSchema,
  ZodRaiseDisputeParamsSchema,
  ZodReduceExchangeFiatBalanceParamsSchema,
  ZodReleaseMerchantFundsParamsSchema,
  ZodReleaseRevenueShareParamsSchema,
  ZodRPPerUsdLimitParamsSchema,
  ZodSellOrderUserCompletedParamsSchema,
  ZodSetReputationManagerParamsSchema,
  ZodSetSellOrderUpiParamsSchema,
  ZodSmallOrderFixedFeeParamsSchema,
  ZodSmallOrderThresholdParamsSchema,
  ZodTipMerchantParamsSchema,
  ZodTxLimitParamsSchema,
  ZodUpdateRpPerUsdtLimitParamsSchema,
  ZodUserBuyLimitParamsSchema,
  ZodUserParamsSchema,
  ZodUserSellLimitParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

// READ OPERATIONS

export function prepareGetTxLimitArgs(params: TxLimitParams): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "userTxLimit";
    args: [Address, Hex];
  },
  P2PError
> {
  return validate(ZodTxLimitParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "userTxLimit" as const,
    args: [
      validatedParams.address,
      stringToHex(validatedParams.currency, { size: 32 }),
    ],
  }));
}

export function prepareGetUserBuyLimitArgs(params: UserBuyLimitParams): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "userBuyLimit";
    args: [Address, Hex];
  },
  P2PError
> {
  return validate(ZodUserBuyLimitParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "userBuyLimit" as const,
      args: [
        validatedParams.address,
        stringToHex(validatedParams.currency, { size: 32 }),
      ],
    }),
  );
}

export function prepareGetUserSellLimitArgs(
  params: UserSellLimitParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "userSellLimit";
    args: [Address, Hex];
  },
  P2PError
> {
  return validate(ZodUserSellLimitParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "userSellLimit" as const,
      args: [
        validatedParams.address,
        stringToHex(validatedParams.currency, { size: 32 }),
      ],
    }),
  );
}

export function prepareGetMerchantRiskCategoryArgs(
  params: MerchantRiskCategoryParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getMerchantRiskCategory";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodMerchantRiskCategoryParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getMerchantRiskCategory" as const,
      args: [validatedParams.merchantAddress],
    }),
  );
}

export function prepareGetUserArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getUser";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getUser" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetExchangeFiatBalanceArgs(
  params: ExchangeFiatBalanceParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getExchangeFiatBalance";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodExchangeFiatBalanceParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getExchangeFiatBalance" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetRPPerUsdLimitArgs(
  params: RPPerUsdLimitParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getRpPerUsdtLimitRational";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodRPPerUsdLimitParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getRpPerUsdtLimitRational" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetOrderByIdArgs(params: OrderByIdParams): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getOrdersById";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderByIdParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getOrdersById" as const,
    args: [BigInt(validatedParams.orderId)],
  }));
}

export function prepareGetUserOrderArrArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "userOrdersArr";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "userOrdersArr" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetOrderExpiryArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getOrderExpiry";
    args: [];
  },
  P2PError
> {
  return validate(ZodExchangeFiatBalanceParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getOrderExpiry" as const,
    args: [],
  }));
}

export function prepareGetOrderAssignedMerchantsArgs(
  params: OrderAssignedMerchantsParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getOrderAssignedMerchants";
    args: [bigint, Address];
  },
  P2PError
> {
  return validate(ZodOrderAssignedMerchantsParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getOrderAssignedMerchants" as const,
      args: [BigInt(validatedParams.orderId), validatedParams.merchant],
    }),
  );
}

export function prepareFetchMerchantAcceptedOrdersArgs(
  params: FetchMerchantOrdersParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "fetchMerchantAcceptedOrders";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodFetchMerchantOrdersParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "fetchMerchantAcceptedOrders" as const,
      args: [validatedParams.merchant],
    }),
  );
}

export function prepareFetchMerchantAssignedOrdersArgs(
  params: FetchMerchantAssignedOrdersParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "fetchMerchantAssignedOrders";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodFetchMerchantAssignedOrdersParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "fetchMerchantAssignedOrders" as const,
      args: [validatedParams.merchant],
    }),
  );
}

export function prepareGetSmallOrderThresholdArgs(
  params: SmallOrderThresholdParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getSmallOrderThreshold";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodSmallOrderThresholdParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getSmallOrderThreshold" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetSmallOrderFixedFeeArgs(
  params: SmallOrderFixedFeeParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getSmallOrderFixedFee";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodSmallOrderFixedFeeParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getSmallOrderFixedFee" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetOrderFixedFeePaidArgs(
  params: OrderFixedFeePaidParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getOrderFixedFeePaid";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderFixedFeePaidParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getOrderFixedFeePaid" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareGetAdditionalOrderDetailsArgs(
  params: OrderAdditionalDetailsParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getAdditionalOrderDetails";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderAdditionalDetailsParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getAdditionalOrderDetails" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareGetOrderCashbackArgs(
  params: OrderCashbackParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getOrderCashback";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderCashbackParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getOrderCashback" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareGetActualUsdtAmountArgs(
  params: OrderActualUsdtAmountParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getAdditionalOrderDetails";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderActualUsdtAmountParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getAdditionalOrderDetails" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareGetActualFiatAmountArgs(
  params: OrderActualFiatAmountParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getAdditionalOrderDetails";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodOrderActualFiatAmountParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getAdditionalOrderDetails" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareCheckCircleEligibilityArgs(
  params: CheckCircleEligibilityParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getAssignableMerchantsFromCircle";
    args: [bigint, bigint, Hex, Address, bigint, bigint, bigint, bigint];
  },
  P2PError
> {
  return validate(ZodCheckCircleEligibilityParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getAssignableMerchantsFromCircle" as const,
      args: [
        validatedParams.circleId,
        1n,
        stringToHex(validatedParams.currency, { size: 32 }),
        validatedParams.user,
        validatedParams.usdtAmount,
        validatedParams.fiatAmount,
        validatedParams.orderType,
        validatedParams.preferredPCConfigId,
      ],
    }),
  );
}

// WRITE OPERATIONS

export function preparePlaceOrderTx(
  params: PlaceOrderParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodPlaceOrderParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "placeOrder",
            args: [
              validatedParams.pubKey,
              validatedParams.amount,
              validatedParams.recipientAddr,
              validatedParams.orderType,
              validatedParams.userUpi,
              validatedParams.userPubKey,
              stringToHex(validatedParams.currency, { size: 32 }),
              validatedParams.preferredPaymentChannelConfigId,
              validatedParams.circleId,
              validatedParams.fiatAmountLimit,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare placeOrder transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "preparePlaceOrderTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareAcceptOrderTx(
  params: AcceptOrderParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodAcceptOrderParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "acceptOrder",
            args: [
              BigInt(validatedParams.orderId),
              validatedParams.userEncUpi,
              validatedParams.pubKey,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare acceptOrder transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareAcceptOrderTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function preparePaidBuyOrderTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodPaidBuyOrderParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "paidBuyOrder",
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare paidBuyOrder transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "preparePaidBuyOrderTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareCompleteOrderTx(
  params: CompleteOrderParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodCompleteOrderParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "completeOrder",
            args: [
              BigInt(validatedParams.orderId),
              validatedParams.merchantUpi,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare completeOrder transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareCompleteOrderTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareCancelOrderTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodCancelOrderParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "cancelOrder",
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare cancelOrder transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareCancelOrderTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareAssignMerchantsTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodAssignMerchantsParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "assignMerchants",
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare assignMerchants transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareAssignMerchantsTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareSellOrderUserCompletedTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodSellOrderUserCompletedParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "sellOrderUserCompleted" as never,
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare sellOrderUserCompleted transaction",
            {
              domain: "order",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareSellOrderUserCompletedTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareSetSellOrderUpiTx(
  params: SetSellOrderUpiParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodSetSellOrderUpiParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "setSellOrderUpi",
            args: [
              BigInt(validatedParams.orderId),
              validatedParams.userEncUpi,
              validatedParams.updatedAmount,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare setSellOrderUpi transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareSetSellOrderUpiTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareAdminSettleDisputeTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodAdminSettleDisputeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "adminSettleDispute",
            args: [
              BigInt(validatedParams.orderId),
              validatedParams.userFault ? 1 : 0,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare adminSettleDispute transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareAdminSettleDisputeTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareFailSafeTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodFailSafeParamsSchema, params).andThen((validatedParams) =>
    Result.fromThrowable(
      () => ({
        to: CONTRACT_ADDRESSES.DIAMOND,
        data: encodeFunctionData({
          abi: ABIS.DIAMOND,
          functionName: "failSafe",
          args: [validatedParams.amount],
        }),
      }),
      (error) =>
        createP2PError("Failed to prepare failSafe transaction", {
          domain: "order",
          code: "P2PPrepareFunctionCallError",
          cause: error,
          context: {
            operation: "prepareFailSafeTx",
            timestamp: Math.floor(Date.now() / 1000),
            rawParams: params,
            validatedParams,
          },
        }),
    )(),
  );
}

export function prepareRaiseDisputeTx(
  params: RaiseDisputeParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodRaiseDisputeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "raiseDispute",
            args: [
              BigInt(validatedParams.orderId),
              validatedParams.redactTransId,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare raiseDispute transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareRaiseDisputeTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareReduceExchangeFiatBalanceTx(
  params: ReduceExchangeFiatBalanceParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodReduceExchangeFiatBalanceParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "reduceExchangeFiatBalance",
            args: [
              stringToHex(validatedParams.nativeCurrency, { size: 32 }),
              validatedParams.amount,
            ] as unknown as readonly [bigint, bigint],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare reduceExchangeFiatBalance transaction",
            {
              domain: "order",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareReduceExchangeFiatBalanceTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareReleaseMerchantFundsTx(
  params: ReleaseMerchantFundsParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodReleaseMerchantFundsParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "releaseMerchantFunds",
            args: [validatedParams.merchant, validatedParams.amount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare releaseMerchantFunds transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareReleaseMerchantFundsTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareReleaseRevenueShareTx(
  params: ReleaseRevenueShareParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodReleaseRevenueShareParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "releaseReveneShare" as never,
            args: [validatedParams.user, validatedParams.amount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare releaseReveneShare transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareReleaseRevenueShareTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareSetReputationManagerTx(
  params: unknown,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodSetReputationManagerParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "setReputationManager",
            args: [validatedParams.addr],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare setReputationManager transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareSetReputationManagerTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareUpdateRpPerUsdtLimitTx(
  params: UpdateRpPerUsdtLimitParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodUpdateRpPerUsdtLimitParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "updateRpPerUsdtLimit" as never,
            args: [
              validatedParams.newLimit,
              stringToHex(validatedParams.nativeCurrency, { size: 32 }),
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare updateRpPerUsdtLimit transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareUpdateRpPerUsdtLimitTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareTipMerchantTx(
  params: TipMerchantParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodTipMerchantParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "tipMerchant",
            args: [BigInt(validatedParams.orderId), validatedParams.tipAmount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare tipMerchant transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareTipMerchantTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}
