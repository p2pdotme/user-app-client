import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, type Hex } from "viem";
import {
  createP2PError,
  type P2PError,
  type USDCApproveParams,
  type USDCTransferParams,
  validate,
  ZodUSDCAllowanceParamsSchema,
  ZodUSDCApproveParamsSchema,
  ZodUSDCBalanceParamsSchema,
  ZodUSDCTransferParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetUSDCBalanceArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.EXTERNAL.USDC;
    functionName: "balanceOf";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUSDCBalanceParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.USDC,
      abi: ABIS.EXTERNAL.USDC,
      functionName: "balanceOf" as const,
      args: [validatedParams.address],
    }),
  );
}

export function prepareGetUSDCAllowanceArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.EXTERNAL.USDC;
    functionName: "allowance";
    args: [Address, Address];
  },
  P2PError
> {
  return validate(ZodUSDCAllowanceParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.USDC,
      abi: ABIS.EXTERNAL.USDC,
      functionName: "allowance" as const,
      args: [validatedParams.address, validatedParams.diamondAddress],
    }),
  );
}

export function prepareUSDCTransferTx(
  params: USDCTransferParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodUSDCTransferParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.USDC,
          data: encodeFunctionData({
            abi: ABIS.EXTERNAL.USDC,
            functionName: "transfer",
            args: [validatedParams.address, validatedParams.amount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare USDC transfer transaction", {
            domain: "usdc",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareUSDCTransferTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
              encodeFunctionDataArgs: {
                abi: "ABIS.EXTERNAL.USDC",
                functionName: "transfer",
                args: [validatedParams.address, validatedParams.amount],
              },
            },
          }),
      )(),
  );
}

export function prepareUSDCApproveTx(
  params: USDCApproveParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodUSDCApproveParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.USDC,
          data: encodeFunctionData({
            abi: ABIS.EXTERNAL.USDC,
            functionName: "approve",
            args: [validatedParams.address, validatedParams.amount],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare USDC approve transaction", {
            domain: "usdc",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareUSDCApproveTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
              encodeFunctionDataArgs: {
                abi: "ABIS.EXTERNAL.USDC",
                functionName: "approve",
                args: [validatedParams.address, validatedParams.amount],
              },
            },
          }),
      )(),
  );
}
