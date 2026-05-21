import { useQuery } from "@tanstack/react-query";
import { fetchUserSwaps } from "@/core/p2p-swap";
import { useThirdweb } from "./use-thirdweb";

export function useP2PSwapHistory() {
  const { account } = useThirdweb();
  const userId = account?.address;

  const query = useQuery({
    queryKey: ["p2p-swap", "history", userId],
    enabled: !!userId,
    queryFn: () => fetchUserSwaps(userId!),
  });

  return {
    swaps: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
