import {
  prepareGetCashbackConfigArgs,
  prepareGetCashbackPercentageArgs,
  prepareGetPriceConfigArgs,
  prepareGetProcessingTimeArgs,
} from "@p2pdotme";
import { ResultAsync } from "neverthrow";
import { createAppError } from "@/lib/errors";
import { viemPublicClient } from "../client";

// READ OPERATIONS - Using readContract with function signatures
export function getPriceConfig(currency: string) {
  return prepareGetPriceConfigArgs({ currency }).asyncAndThen(
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
            "Failed to read price config from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { currency, to, args },
            },
          ),
      ),
  );
}

export const getProcessingTime = () => {
  return prepareGetProcessingTimeArgs().asyncAndThen(
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
            "Failed to read processing time from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
};

export const getCashbackConfig = () => {
  return prepareGetCashbackConfigArgs().asyncAndThen(
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
            "Failed to read cashback config from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
};

export const getCashbackPercentage = () => {
  return prepareGetCashbackPercentageArgs().asyncAndThen(
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
            "Failed to read cashback percentage from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
};
