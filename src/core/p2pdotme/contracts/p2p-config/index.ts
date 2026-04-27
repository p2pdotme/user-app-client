import type { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { type Hex, stringToHex } from "viem";
import {
  type P2PError,
  validate,
  ZodCashbackConfigParamsSchema,
  ZodCashbackPercentageParamsSchema,
  ZodPriceConfigParamsSchema,
  ZodProcessingTimeParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetPriceConfigArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getPriceConfig";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodPriceConfigParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getPriceConfig" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}

export function prepareGetProcessingTimeArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getProcessingTime";
    args: [];
  },
  P2PError
> {
  return validate(ZodProcessingTimeParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getProcessingTime" as const,
    args: [],
  }));
}

export function prepareGetCashbackConfigArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getCashbackConfig";
    args: [];
  },
  P2PError
> {
  return validate(ZodCashbackConfigParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getCashbackConfig" as const,
    args: [],
  }));
}

export function prepareGetCashbackPercentageArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getCashbackPercentage";
    args: [];
  },
  P2PError
> {
  return validate(ZodCashbackPercentageParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "getCashbackPercentage" as const,
    args: [],
  }));
}
