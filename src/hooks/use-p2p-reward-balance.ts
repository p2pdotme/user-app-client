import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { erc20Abi, formatUnits } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { CONTRACT_ADDRESSES } from "@/core/p2pdotme/contracts/abis";
import { useThirdweb } from "./use-thirdweb";

const P2P_TOKEN_ADDRESS = CONTRACT_ADDRESSES.P2P_TOKEN;
const P2P_TOKEN_DECIMALS = 6;
const P2P_TOKEN_SYMBOL = "P2P";

interface P2pRewardBalanceSummary {
  hasBalance: boolean;
  rawAmount: bigint;
  formattedAmount: string;
  displayAmount: string;
  decimals: number;
  tokenAddress: Address;
  tokenSymbol: string;
}

export function useP2pRewardBalance() {
  const { account } = useThirdweb();
  const userAddress = account?.address as Address | undefined;

  return useQuery<P2pRewardBalanceSummary>({
    queryKey: ["p2p-reward-balance", userAddress],
    enabled: !!userAddress,
    queryFn: async () => {
      if (!userAddress) {
        return {
          hasBalance: false,
          rawAmount: 0n,
          formattedAmount: "0",
          displayAmount: "0",
          decimals: P2P_TOKEN_DECIMALS,
          tokenAddress: P2P_TOKEN_ADDRESS,
          tokenSymbol: P2P_TOKEN_SYMBOL,
        };
      }

      const balance = await viemPublicClient.readContract({
        address: P2P_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [userAddress],
      });

      const formattedAmount = formatUnits(balance, P2P_TOKEN_DECIMALS);
      const amountNumber = Number(formattedAmount);

      const displayAmount =
        Number.isFinite(amountNumber) && amountNumber > 0
          ? amountNumber.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: amountNumber < 1 ? 4 : 2,
            })
          : "0";

      return {
        hasBalance: balance > 0n,
        rawAmount: balance,
        formattedAmount,
        displayAmount,
        decimals: P2P_TOKEN_DECIMALS,
        tokenAddress: P2P_TOKEN_ADDRESS,
        tokenSymbol: P2P_TOKEN_SYMBOL,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
