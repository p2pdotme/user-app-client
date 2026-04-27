import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { useCashbackConfig } from "./use-cashback-config";
import { useThirdweb } from "./use-thirdweb";

interface CbBtcBalanceSummary {
  hasBalance: boolean;
  rawAmount: bigint;
  formattedAmount: string;
  displayAmount: string;
  decimals: number;
  tokenAddress: Address;
  tokenSymbol: string;
}

export function useCbBtcBalance() {
  const { account } = useThirdweb();
  const { data: cashbackConfig, isLoading: isConfigLoading } =
    useCashbackConfig();

  const userAddress = account?.address as Address | undefined;
  const tokenAddress = cashbackConfig?.cashbackToken as Address | undefined;

  return useQuery<CbBtcBalanceSummary>({
    queryKey: ["cbbtc-balance", userAddress, tokenAddress],
    enabled:
      !!userAddress &&
      !!tokenAddress &&
      tokenAddress.toLowerCase() !== zeroAddress.toLowerCase() &&
      !isConfigLoading,
    queryFn: async () => {
      if (!userAddress || !tokenAddress) {
        return {
          hasBalance: false,
          rawAmount: 0n,
          formattedAmount: "0",
          displayAmount: "0",
          decimals: 8,
          tokenAddress: zeroAddress,
          tokenSymbol: "cbBTC",
        };
      }

      // Fetch balance and decimals in parallel
      const [balance, decimals, symbol] = await Promise.all([
        viemPublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress],
        }),
        viemPublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
        viemPublicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
      ]);

      const formattedAmount = formatUnits(balance, decimals);
      const amountNumber = Number(formattedAmount);

      // Format for display with appropriate decimal places
      const displayAmount =
        Number.isFinite(amountNumber) && amountNumber > 0
          ? amountNumber.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: amountNumber < 0.0001 ? 8 : 5,
            })
          : "0";

      return {
        hasBalance: balance > 0n,
        rawAmount: balance,
        formattedAmount,
        displayAmount,
        decimals,
        tokenAddress,
        tokenSymbol: symbol,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
