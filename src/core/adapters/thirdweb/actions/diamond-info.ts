import { ResultAsync } from "neverthrow";
import { hexToString } from "viem";
import { type P2PError, prepareGetContractVersionArgs } from "@/core";
import { createAppError } from "@/lib/errors";
import { type ThirdwebAdapterError, viemPublicClient } from "../client";

export function getContractVersion(): ResultAsync<
  string,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetContractVersionArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }) as Promise<`0x${string}`>,
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read contract version from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ).map((bytes32Value) => {
        // Decode bytes32 to string and remove null bytes
        const decodedVersion = hexToString(bytes32Value, { size: 32 });
        // Remove trailing null characters
        return decodedVersion.replace(/\0/g, "");
      }),
  );
}
