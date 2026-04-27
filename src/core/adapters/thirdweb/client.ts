import type { AbiFunction } from "abitype";
import { ResultAsync } from "neverthrow";
import {
  type Address,
  createThirdwebClient,
  estimateGas,
  eth_maxPriorityFeePerGas,
  getRpcClient,
  type Hex,
  type PreparedTransaction,
  type PrepareTransactionOptions,
  prepareTransaction,
  type ThirdwebClient,
} from "thirdweb";
import { viemAdapter } from "thirdweb/adapters/viem";
import type { ChainOptions } from "thirdweb/chains";
import { createPublicClient, webSocket } from "viem";
import {
  type AppError,
  createAppError,
  parseContractError,
} from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { captureError } from "@/lib/sentry";
import { chain, viemChain } from "./chain";

export type ThirdwebAdapterError = AppError<"ThirdwebAdapter">;

const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;
export const thirdwebClient = createThirdwebClient({
  clientId,
});

export const accountAbstraction = {
  sponsorGas: true,
  chain,
  factoryAddress: import.meta.env.VITE_THIRDWEB_CONTRACT_ADDRESS_AA_FACTORY,
};

export const viemPublicClient = viemAdapter.publicClient.toViem({
  client: thirdwebClient,
  chain,
});

/**
 * Viem public client with websocket transport for efficient event listening.
 */
export const viemWebsocketClient = createPublicClient({
  chain: viemChain,
  transport: webSocket(import.meta.env.VITE_WS_RPC_URL),
});

/**
 * Estimates the gas for a transaction and prepares it with appropriate fee parameters. This ensures
 * the transaction has sufficient gas and optimized fees for timely inclusion in the blockchain.
 *
 * The function:
 * - Estimates gas usage for the transaction.
 * - Fetches the current `maxPriorityFeePerGas` from the network.
 * - Doubles the estimated gas to account for variability.
 * - Sets a fixed `maxFeePerGas` and the fetched `maxPriorityFeePerGas`.
 */
export const estimatedPrepareTransaction = ({
  from,
  to,
  chain,
  client,
  data,
}: {
  from: Address;
  to: Address;
  chain: Readonly<
    ChainOptions & {
      rpc: string;
    }
  >;
  client: ThirdwebClient;
  data: Hex;
}): ResultAsync<
  PreparedTransaction<[], AbiFunction, PrepareTransactionOptions>,
  ThirdwebAdapterError
> => {
  const transaction = prepareTransaction({ to, chain, client, data });

  const estimateGasResult = ResultAsync.fromPromise(
    estimateGas({ transaction, from }),
    (error) => {
      const err = createAppError<"ThirdwebAdapter">(
        i18n.t(parseContractError(error) ?? "FAILED_TO_ESTIMATE_GAS"),
        {
          domain: "ThirdwebAdapter",
          code: "TWEstimateGasError",
          cause: error,
          context: { from, to, chain, client, data },
        },
      );

      captureError(err, {
        operation: "estimate_gas",
        component: "estimatedPrepareTransaction",
        userId: from,
      });
      return err;
    },
  );

  const maxPriorityFeeResult = ResultAsync.fromPromise(
    eth_maxPriorityFeePerGas(getRpcClient({ client, chain })),
    (error) => {
      const err = createAppError<"ThirdwebAdapter">(
        "Failed to get max priority fee per gas",
        {
          domain: "ThirdwebAdapter",
          code: "TWMaxPriorityFeeError",
          cause: error,
          context: { from, to, chain, client, data },
        },
      );

      captureError(err, {
        operation: "max_priority_fee_per_gas",
        component: "maxPriorityFeePerGas",
        userId: from,
      });

      return err;
    },
  );

  return ResultAsync.combine([estimateGasResult, maxPriorityFeeResult]).map(
    ([estimatedGas, maxPriorityFeePerGas]) =>
      prepareTransaction({
        to,
        chain,
        client,
        data,
        extraGas: estimatedGas * 2n,
        maxFeePerGas: 400000000n,
        maxPriorityFeePerGas,
      }),
  );
};
