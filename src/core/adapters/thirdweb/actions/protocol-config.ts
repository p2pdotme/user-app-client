import { prepareGetRewardsConfigArgs } from "@p2pdotme";
import { ResultAsync } from "neverthrow";
import { createAppError } from "@/lib/errors";
import { viemPublicClient } from "../client";

export function getRewardsConfig(currency: string) {
  return prepareGetRewardsConfigArgs({ currency }).asyncAndThen(
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
            "Failed to read rewards config from contract",
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
