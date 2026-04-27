import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { useSafeDynamicContext } from "@/contexts";
import { fetchWalletTokensByChain } from "@/core/rango";
import { bridgeMetaDeposit, bridgeMetaWithdraw } from "@/core/rango/config";
import type { SupportedBridgeChains } from "@/core/rango/types";

export function useRangoFetch(
  chain: SupportedBridgeChains,
  bridgeType: "DEPOSIT" | "WITHDRAW" = "DEPOSIT",
) {
  const { primaryWallet } = useSafeDynamicContext();

  const bridgeMetadata =
    bridgeType === "DEPOSIT" ? bridgeMetaDeposit : bridgeMetaWithdraw;

  const {
    data: rangoBalance,
    isLoading: isRangoBalanceLoading,
    isError: isRangoBalanceError,
    error: rangoBalanceError,
  } = useQuery({
    queryKey: ["rango", "balance", chain, bridgeType, primaryWallet?.address],
    queryFn: async () => {
      return fetchWalletTokensByChain(
        primaryWallet?.address as Address,
        chain,
        bridgeMetadata,
      ).match(
        (value) => {
          console.log("[useRangoFetch] balance", value);
          return value;
        },
        (error) => {
          console.log("[useRangoFetch] error", error);
          throw error;
        },
      );
    },
    enabled: !!primaryWallet?.address && !!chain,
  });

  return {
    rangoBalance,
    isRangoBalanceLoading,
    isRangoBalanceError,
    rangoBalanceError,
  };
}
