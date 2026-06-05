import { useQuery } from "@tanstack/react-query";
import { getUserP2PStakeActivities } from "@/core/p2pdotme/subgraph";
import { useThirdweb } from "./use-thirdweb";

/**
 * useUserP2PStakeActivities — fetches the immutable activity timeline of the
 * connected user's P2P stake from the subgraph. Returns activities sorted by
 * timestamp desc (newest first). Returns null until the wallet is connected.
 */
export function useUserP2PStakeActivities() {
  const { account } = useThirdweb();
  const userAddress = account?.address?.toLowerCase() ?? null;

  return useQuery({
    queryKey: ["subgraph", "userP2PStakeActivities", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const result = await getUserP2PStakeActivities({
        userAddress,
        first: 100,
        skip: 0,
      });
      return result.match(
        (activities) => activities,
        (error) => {
          console.error(
            "[useUserP2PStakeActivities] subgraph error",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!userAddress,
  });
}
