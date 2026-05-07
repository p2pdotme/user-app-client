import { useQuery } from "@tanstack/react-query";
import { createPublicClient, formatUnits, http } from "viem";
import { sepolia } from "viem/chains";
import { WORMHOLE } from "./constants";

// Dedicated Eth Sepolia client — independent of VITE_CHAIN
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
});

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
    queryKey: ["gov-token-balance", address],
    queryFn: async () => {
      const raw = await sepoliaClient.readContract({
        address: WORMHOLE.P2P_GOV_TOKEN,
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
