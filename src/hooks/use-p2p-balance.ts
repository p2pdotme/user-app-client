import { useQuery } from "@tanstack/react-query";
import { erc20Abi, formatUnits } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { EVM_CHAIN, getNttContracts } from "@/core/wormhole/config";
import { useThirdweb } from "@/hooks/use-thirdweb";

const BASE_P2P_ADDRESS = getNttContracts(EVM_CHAIN).token as `0x${string}`;

export function useP2PBalance() {
  const { account } = useThirdweb();

  const {
    data: p2pBalance,
    isLoading: isP2PBalanceLoading,
    isError: isP2PBalanceError,
    refetch: refetchP2PBalance,
    isFetching: isP2PBalanceFetching,
  } = useQuery({
    queryKey: ["p2p", "balance", "base", account?.address],
    queryFn: async () => {
      const [raw, decimals] = await Promise.all([
        viemPublicClient.readContract({
          address: BASE_P2P_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account!.address as `0x${string}`],
        }),
        viemPublicClient.readContract({
          address: BASE_P2P_ADDRESS,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);
      return { raw, formatted: Number(formatUnits(raw, decimals)) };
    },
    enabled: !!account?.address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    p2pBalance: p2pBalance?.formatted ?? null,
    p2pBalanceRaw: p2pBalance?.raw ?? null,
    isP2PBalanceLoading,
    isP2PBalanceError,
    refetchP2PBalance,
    isP2PBalanceFetching,
  };
}
