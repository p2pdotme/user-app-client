import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, type Hex, stringToHex } from "viem";
import {
  type AppealDisputeParams,
  createP2PError,
  type DisputeEscalationParams,
  type FinalizeDisputeParams,
  type OrderAdditionalDetailsParams,
  type OrderByIdParams,
  type OrderCashbackParams,
  type P2PError,
  type RaiseDisputeParams,
  type SmallOrderFixedFeeBuyParams,
  type SmallOrderFixedFeePayParams,
  type SmallOrderFixedFeeSellParams,
  type SmallOrderThresholdParams,
  type TipMerchantParams,
  type UserParams,
  validate,
  ZodAppealDisputeParamsSchema,
  ZodCancelOrderParamsSchema,
  ZodDisputeEscalationParamsSchema,
  ZodFinalizeDisputeParamsSchema,
  ZodOrderAdditionalDetailsParamsSchema,
  ZodOrderByIdParamsSchema,
  ZodOrderCashbackParamsSchema,
  ZodPaidBuyOrderParamsSchema,
  ZodRaiseDisputeParamsSchema,
  ZodSmallOrderFixedFeeBuyParamsSchema,
  ZodSmallOrderFixedFeePayParamsSchema,
  ZodSmallOrderFixedFeeSellParamsSchema,
  ZodSmallOrderThresholdParamsSchema,
  ZodTipMerchantParamsSchema,
  ZodUserParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

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

export function prepareGetSmallOrderFixedFeeBuyArgs(
  params: SmallOrderFixedFeeBuyParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getSmallOrderFixedFeeBuy";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodSmallOrderFixedFeeBuyParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getSmallOrderFixedFeeBuy" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetSmallOrderFixedFeeSellArgs(
  params: SmallOrderFixedFeeSellParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getSmallOrderFixedFeeSell";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodSmallOrderFixedFeeSellParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getSmallOrderFixedFeeSell" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetSmallOrderFixedFeePayArgs(
  params: SmallOrderFixedFeePayParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getSmallOrderFixedFeePay";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodSmallOrderFixedFeePayParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getSmallOrderFixedFeePay" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
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

// ---- Dispute escalation (appeal / finalize) ----

export function prepareAppealDisputeTx(
  params: AppealDisputeParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodAppealDisputeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "appealDispute",
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare appealDispute transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareAppealDisputeTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareFinalizeDisputeTx(
  params: FinalizeDisputeParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodFinalizeDisputeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.DIAMOND,
            functionName: "finalizeDispute",
            args: [BigInt(validatedParams.orderId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare finalizeDispute transaction", {
            domain: "order",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareFinalizeDisputeTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareGetDisputeTierArgs(
  params: DisputeEscalationParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getDisputeTier";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodDisputeEscalationParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getDisputeTier" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
  );
}

export function prepareGetDisputeDecisionArgs(
  params: DisputeEscalationParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getDisputeDecision";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodDisputeEscalationParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getDisputeDecision" as const,
      args: [BigInt(validatedParams.orderId)],
    }),
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
