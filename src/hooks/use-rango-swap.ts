import { useMutation } from "@tanstack/react-query";
import { useSafeDynamicContext } from "@/contexts";
import { swapRango } from "@/core/rango";
import { createAppError } from "@/lib/errors";
import { captureError, withSentrySpan } from "@/lib/sentry";
import { useThirdweb } from "./use-thirdweb";

interface RangoSwapParams {
  bridgeType: "DEPOSIT" | "WITHDRAW";
  token: {
    blockchain: string;
    address: string | null;
  };
  amount: string;
  recipientAddress?: string; // Required for withdraws
}

export function useRangoSwap() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();

  return useMutation({
    mutationFn: async (params: RangoSwapParams) => {
      const { bridgeType, token, amount, recipientAddress } = params;

      return withSentrySpan(
        "rango.swap",
        `Rango ${bridgeType} Swap`,
        async () => {
          // Determine addresses based on bridge type
          const fromAddress =
            bridgeType === "DEPOSIT"
              ? primaryWallet?.address
              : account?.address;
          const toAddress =
            bridgeType === "DEPOSIT" ? account?.address : recipientAddress;

          const domain =
            bridgeType === "DEPOSIT" ? "RangoDeposit" : "RangoWithdraw";
          const errorCode =
            bridgeType === "DEPOSIT"
              ? "RangoDepositError"
              : "RangoWithdrawError";

          // Validate parameters
          if (!fromAddress) {
            throw createAppError("SOURCE_WALLET_NOT_CONNECTED", {
              domain,
              code: errorCode,
              cause: { bridgeType, fromAddress },
              context: { bridgeType, fromAddress },
            });
          }

          if (!toAddress) {
            const errorMessage =
              bridgeType === "WITHDRAW"
                ? "RECIPIENT_ADDRESS_NOT_PROVIDED"
                : "DESTINATION_WALLET_NOT_CONNECTED";
            throw createAppError(errorMessage, {
              domain,
              code: errorCode,
              cause: { bridgeType, toAddress, recipientAddress },
              context: { bridgeType, toAddress, recipientAddress },
            });
          }

          if (!token.blockchain) {
            throw createAppError("TOKEN_BLOCKCHAIN_NOT_SPECIFIED", {
              domain,
              code: errorCode,
              cause: { token },
              context: { token },
            });
          }

          if (token.address === undefined) {
            throw createAppError("TOKEN_ADDRESS_NOT_SPECIFIED", {
              domain,
              code: errorCode,
              cause: { token },
              context: { token },
            });
          }

          if (!amount || amount === "0" || Number(amount) <= 0) {
            throw createAppError("INVALID_AMOUNT", {
              domain,
              code: errorCode,
              cause: { amount },
              context: { amount },
            });
          }

          // Execute the swap
          return swapRango(
            bridgeType,
            token,
            amount,
            fromAddress,
            toAddress,
          ).match(
            (value) => {
              console.log("[useRangoSwap] swap success", value);
              return value;
            },
            (error) => {
              console.log("[useRangoSwap] swap error", error);

              captureError(error, {
                operation: "rango_swap_execution",
                component: "useRangoSwap",
                userId: account?.address || primaryWallet?.address,
                extra: {
                  bridgeType,
                  token,
                  amount,
                  fromAddress,
                  toAddress,
                  recipientAddress,
                },
              });

              // Re-throw as AppError if it's not already one
              if (error && typeof error === "object" && "domain" in error) {
                throw error;
              }
              const appError = createAppError("RANGO_SWAP_ERROR", {
                domain,
                code: "RangoSwapError",
                cause: error,
                context: {
                  bridgeType,
                  token,
                  amount,
                  fromAddress,
                  toAddress,
                  recipientAddress,
                },
              });

              captureError(appError, {
                operation: "rango_swap_execution",
                component: "useRangoSwap",
                userId: account?.address || primaryWallet?.address,
                extra: { bridgeType, errorType: "general_swap_error" },
              });

              throw appError;
            },
          );
        },
      );
    },
  });
}
