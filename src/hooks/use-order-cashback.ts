import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits, zeroAddress } from "viem";
import { getOrderCashback, getTokenMetadata } from "@/core/adapters/thirdweb";

interface OrderCashbackSummary {
  hasCashback: boolean;
  tokenAddress?: Address;
  tokenSymbol?: string;
  decimals?: number;
  rawAmount: bigint;
  formattedAmount: string;
  displayAmount: string;
}

export function useOrderCashback(orderId: number) {
  return useQuery<OrderCashbackSummary>({
    queryKey: ["order", "cashback", orderId],
    enabled: Number.isFinite(orderId) && orderId > 0,
    queryFn: async () => {
      const result = await getOrderCashback({ orderId });
      const cashback = await result.match(
        (value) =>
          value as {
            amount: bigint;
            token: Address;
          },
        (error) => {
          throw error;
        },
      );

      const hasValidToken =
        cashback.token &&
        cashback.token.toLowerCase() !== zeroAddress.toLowerCase();

      if (!hasValidToken || cashback.amount === 0n) {
        return {
          hasCashback: false,
          tokenAddress: cashback.token,
          rawAmount: cashback.amount ?? 0n,
          formattedAmount: "0",
          displayAmount: "0",
        };
      }

      const metadataResult = await getTokenMetadata({
        tokenAddress: cashback.token as Address,
      });

      const metadata = await metadataResult.match(
        (meta) => meta,
        (error) => {
          throw error;
        },
      );

      const formattedAmount = formatUnits(cashback.amount, metadata.decimals);
      const amountNumber = Number(formattedAmount);
      const displayAmount =
        Number.isFinite(amountNumber) && amountNumber > 0
          ? amountNumber.toLocaleString(undefined, {
              maximumFractionDigits: amountNumber < 1 ? 4 : 2,
            })
          : formattedAmount;

      return {
        hasCashback: cashback.amount > 0n,
        tokenAddress: cashback.token,
        tokenSymbol: metadata.symbol,
        decimals: metadata.decimals,
        rawAmount: cashback.amount,
        formattedAmount,
        displayAmount,
      };
    },
  });
}
