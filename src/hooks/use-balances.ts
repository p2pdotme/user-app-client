import { useProfile } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { useSettings } from "@/contexts";
import type { Currency } from "@/core";
import { useThirdweb } from "@/hooks/use-thirdweb";

export function useBalances(currencySymbol?: Currency["currency"]) {
  const { account } = useThirdweb();
  const {
    settings: { currency },
  } = useSettings();
  const profile = useProfile();

  const symbol = currencySymbol || currency.currency;

  const {
    data: balances,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
    error: balancesError,
  } = useQuery({
    queryKey: ["balances", account?.address, symbol],
    queryFn: async () => {
      return profile
        .getBalances({
          address: account?.address as Address,
          currency: symbol,
        })
        .match(
          (value) => {
            console.log("[useBalances] balances", value);
            return value;
          },
          (error) => {
            console.log("[useBalances] error", error);
            throw error;
          },
        );
    },
    enabled: !!account?.address && !!symbol,
  });

  return {
    balances,
    isBalancesLoading,
    isBalancesError,
    balancesError,
  };
}
