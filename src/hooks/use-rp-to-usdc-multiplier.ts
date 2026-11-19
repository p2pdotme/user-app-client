import { usePrices } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts";

/**
 * USDC of per-order limit granted per reputation point in the user's market.
 *
 * The one place this number is fetched: the method cards on /limits and the
 * verification rows on its sub-pages share the cache key, so they must also
 * share the error handling. On a failed fetch it stays `undefined` (never 1:
 * that showed raw reputation points as if they were USDC) and callers hide
 * the amount.
 */
export function useRpToUsdcMultiplier(): number | undefined {
  const { settings } = useSettings();
  const prices = usePrices();
  const { data } = useQuery({
    queryKey: ["rp-per-usdt-limit", settings.currency.currency],
    queryFn: async () =>
      prices
        .getReputationPerUsdcLimit({ currency: settings.currency.currency })
        .match(
          (value) => value.multiplier,
          (error) => {
            throw error;
          },
        ),
  });
  return data;
}
