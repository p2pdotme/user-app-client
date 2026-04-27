import { usePrices } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { useSettings } from "@/contexts";
import type { Currency } from "@/core";

export function usePriceConfig(currencySymbol?: Currency["currency"]) {
  const {
    settings: { currency },
  } = useSettings();
  const prices = usePrices();

  const symbol = currencySymbol || currency.currency;

  const {
    data: priceConfig,
    isLoading: isPriceConfigLoading,
    isError: isPriceConfigError,
    error: priceConfigError,
  } = useQuery({
    queryKey: ["priceConfig", symbol],
    queryFn: async () => {
      return prices.getPriceConfig({ currency: symbol }).match(
        (value) => {
          const priceConfig = {
            buyPrice: Number(formatUnits(value.buyPrice, 6)),
            sellPrice: Number(formatUnits(value.sellPrice, 6)),
          };
          console.log("[usePriceConfig] priceConfig", priceConfig);
          return priceConfig;
        },
        (error) => {
          console.log("[usePriceConfig] error", error);
          throw error;
        },
      );
    },
    enabled: !!symbol,
  });

  return {
    priceConfig,
    isPriceConfigLoading,
    isPriceConfigError,
    priceConfigError,
  };
}
