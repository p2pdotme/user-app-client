import { useProfile } from "@p2pdotme/sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits } from "viem";
import { transferUSDC } from "@/core/adapters/thirdweb";
import type { USDCTransferParams } from "@/core/p2pdotme/shared/validation";
import { useThirdweb } from "@/hooks";
import { captureError, withSentrySpan } from "@/lib/sentry";

export function useUSDCBalance() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const profile = useProfile();

  // BALANCE QUERY
  const {
    data: usdcBalance,
    isLoading: isUsdcBalanceLoading,
    isError: isUsdcBalanceError,
    error: usdcBalanceError,
  } = useQuery({
    queryKey: ["usdc", "balance", account?.address],
    queryFn: async () => {
      return profile
        .getUsdcBalance({ address: account?.address as Address })
        .match(
          (value) => {
            const balance = Number(formatUnits(value, 6));
            console.log("[useUSDCBalance] balance", balance);
            return balance;
          },
          (error) => {
            console.log("[useUSDCBalance] error", error);
            throw error;
          },
        );
    },
    enabled: !!account?.address,
  });

  // TRANSFER MUTATION - Enhanced with Sentry
  const transferMutation = useMutation({
    mutationKey: ["usdc", "transfer"],
    mutationFn: async (params: USDCTransferParams) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.usdc_transfer",
        "USDC Transfer Transaction",
        async () => {
          return transferUSDC(params, account).match(
            (value) => {
              console.log("[useUSDCBalance] transferUSDC success", value);
              return value;
            },
            (error) => {
              console.error("[useUSDCBalance] transferUSDC error", error);

              // Capture error with context
              captureError(error, {
                operation: "usdc_transfer",
                component: "useUSDCBalance",
                userId: account.address,
                extra: {
                  recipientAddress: params.address,
                  amount: params.amount.toString(),
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      // Invalidate balance queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
    },
  });

  return {
    usdcBalance,
    isUsdcBalanceLoading,
    isUsdcBalanceError,
    usdcBalanceError,
    transferMutation,
  };
}
