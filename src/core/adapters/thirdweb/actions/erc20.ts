import { ResultAsync } from "neverthrow";
import type { Address } from "thirdweb";
import { erc20Abi } from "viem";
import { createAppError } from "@/lib/errors";
import { viemPublicClient } from "../client";

export interface TokenMetadata {
  symbol: string;
  decimals: number;
}

export function getTokenMetadata(params: { tokenAddress: Address }) {
  const { tokenAddress } = params;

  const symbolResult = ResultAsync.fromPromise(
    viemPublicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    (error) =>
      createAppError<"ThirdwebAdapter">("Failed to read token symbol", {
        domain: "ThirdwebAdapter",
        code: "TWReadContractError",
        cause: error,
        context: { tokenAddress, functionName: "symbol" },
      }),
  );

  const decimalsResult = ResultAsync.fromPromise(
    viemPublicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    (error) =>
      createAppError<"ThirdwebAdapter">("Failed to read token decimals", {
        domain: "ThirdwebAdapter",
        code: "TWReadContractError",
        cause: error,
        context: { tokenAddress, functionName: "decimals" },
      }),
  );

  return ResultAsync.combine([symbolResult, decimalsResult]).map(
    ([symbol, decimals]) => ({
      symbol: typeof symbol === "string" ? symbol : "",
      decimals: Number(decimals),
    }),
  );
}
