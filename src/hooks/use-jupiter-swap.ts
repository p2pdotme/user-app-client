import { isSolanaWallet } from "@dynamic-labs/solana";
import { useMutation } from "@tanstack/react-query";
import { useSafeDynamicContext } from "@/contexts";
import {
  deserializeJupiterTransaction,
  type JupiterSwapDirection,
  orderJupiterP2PToUsdc,
  orderJupiterUsdcToP2P,
} from "@/core/jupiter";
import { createAppError } from "@/lib/errors";
import { captureError, withSentrySpan } from "@/lib/sentry";

interface JupiterSwapParams {
  amount: string; // in smallest unit
  direction: JupiterSwapDirection;
}

interface JupiterSwapResult {
  signature: string;
  outAmount: string;
}

export function useJupiterSwap() {
  const { primaryWallet } = useSafeDynamicContext();

  return useMutation({
    mutationFn: async ({
      amount,
      direction,
    }: JupiterSwapParams): Promise<JupiterSwapResult> => {
      return withSentrySpan("jupiter.swap", `Jupiter ${direction} Swap`, async () => {
        if (!primaryWallet || !isSolanaWallet(primaryWallet)) {
          throw createAppError("Solana wallet not connected", {
            domain: "JupiterSwap",
            code: "JupiterSwapError",
            cause: {},
            context: {},
          });
        }

        const taker = primaryWallet.address;

        // 1. Get order for the requested direction
        const orderFn =
          direction === "USDC_TO_P2P" ? orderJupiterUsdcToP2P : orderJupiterP2PToUsdc;

        const orderResult = await orderFn(amount, taker);
        if (orderResult.isErr()) throw orderResult.error;

        const { transaction: base64Tx, outAmount } = orderResult.value;

        // 2. Deserialize
        const txResult = await deserializeJupiterTransaction(base64Tx);
        if (txResult.isErr()) throw txResult.error;

        // 3. Sign and send via Dynamic Solana wallet
        const signer = await primaryWallet.getSigner();
        const { signature } = await signer.signAndSendTransaction(txResult.value);

        console.log("[useJupiterSwap] Transaction sent:", signature);

        return { signature, outAmount };
      });
    },
    onError: (error, variables) => {
      captureError(error, {
        operation: "jupiter_swap",
        component: "useJupiterSwap",
        userId: primaryWallet?.address,
        extra: { amount: variables.amount, direction: variables.direction },
      });
    },
  });
}
