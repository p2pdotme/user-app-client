import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb/client";
import { WORMHOLE } from "./constants";

const ERC20_BALANCE_OF_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export function useGovBaseBalance(address: string | undefined) {
  return useQuery({
    queryKey: ["gov-base-balance", address],
    queryFn: async () => {
      const raw = await viemPublicClient.readContract({
        address: WORMHOLE.P2P_GOV_BASE_TOKEN,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });
      return formatUnits(raw, WORMHOLE.SPL_DECIMALS);
    },
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
