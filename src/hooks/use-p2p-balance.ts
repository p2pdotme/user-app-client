import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { erc20Abi } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { useThirdweb } from "./use-thirdweb";

const P2P_TOKEN_ADDRESS =
  "0x75a8FF75a4f224947A6315b8dab5D5a81FE2f550" as Address;

export function useP2PBalance() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  const userAddress = account?.address as Address | undefined;

  const query = useQuery({
    queryKey: ["p2p", "balance", userAddress],
    enabled: !!userAddress,
    staleTime: 10_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [balance, decimals] = await Promise.all([
        viemPublicClient.readContract({
          address: P2P_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress as Address],
        }),
        viemPublicClient.readContract({
          address: P2P_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      return { raw: balance, decimals };
    },
  });

  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: ["p2p", "balance", userAddress] });

  return {
    p2pBalanceRaw: query.data?.raw ?? null,
    isP2PBalanceLoading: query.isLoading,
    refetchP2PBalance: refetch,
  };
}
