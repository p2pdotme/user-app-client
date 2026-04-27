import { useMutation, useQueryClient } from "@tanstack/react-query";
import { raiseDispute as raiseDisputeTx } from "@/core/adapters/thirdweb";
import type { RaiseDisputeParams } from "@/core/p2pdotme/shared/validation";
import { useThirdweb } from "@/hooks";
import { captureError, withSentrySpan } from "@/lib/sentry";

export function useRaiseDispute() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  // RAISE DISPUTE - Enhanced with Sentry
  const raiseDisputeMutation = useMutation({
    mutationKey: ["raiseDispute"],
    mutationFn: async (params: RaiseDisputeParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.raise_dispute",
        "Raise Dispute Transaction",
        async () => {
          return raiseDisputeTx(params, account).match(
            (value) => {
              console.log("[useRaiseDispute] raiseDispute success", value);
              return value;
            },
            (error) => {
              console.error("[useRaiseDispute] raiseDispute error", error);

              // Capture error with context
              captureError(error, {
                operation: "raise_dispute",
                component: "useRaiseDispute",
                userId: account.address,
                extra: {
                  orderId: params.orderId,
                  redactTransId: params.redactTransId.toString(),
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
    },
  });

  return {
    raiseDisputeMutation,
  };
}
