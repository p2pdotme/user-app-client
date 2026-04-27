import type { Result } from "neverthrow";
import type { Address } from "thirdweb";
import {
  type P2PError,
  validate,
  ZodContractVersionParamsSchema,
} from "@/core";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetContractVersionArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "contractVersion";
    args: [];
  },
  P2PError
> {
  return validate(ZodContractVersionParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.DIAMOND,
    abi: ABIS.DIAMOND,
    functionName: "contractVersion" as const,
    args: [],
  }));
}
