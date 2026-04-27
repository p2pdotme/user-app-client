import type { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { type Hex, stringToHex } from "viem";
import {
  type P2PError,
  validate,
  ZodRewardsConfigParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetRewardsConfigArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getRewardsConfig";
    args: [Hex];
  },
  P2PError
> {
  return validate(ZodRewardsConfigParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getRewardsConfig" as const,
      args: [stringToHex(validatedParams.currency, { size: 32 })],
    }),
  );
}
