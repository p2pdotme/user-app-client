import { useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { quoteRango } from "@/core/rango";

export function useRangoQuote(
  bridgeType: "DEPOSIT" | "WITHDRAW",
  token: {
    blockchain: string;
    address: string | null;
  },
  amount: string,
) {
  // Debounce the amount to prevent excessive API calls while user is typing
  // React will defer updates to this value when more urgent updates are pending
  const deferredAmount = useDeferredValue(amount);

  return useQuery({
    queryKey: [
      "rango",
      "quote",
      bridgeType,
      token,
      deferredAmount, // Use debounced amount in query key
    ],
    queryFn: async () => {
      // Use the deferred amount for the actual API call
      return quoteRango(bridgeType, token, deferredAmount).match(
        (value) => {
          console.log("[useRangoQuote] quote", value);
          return value;
        },
        (error) => {
          console.log("[useRangoQuote] error", error);
          throw error;
        },
      );
    },
    enabled:
      !!token.blockchain &&
      token.address !== undefined &&
      !!deferredAmount &&
      deferredAmount !== "0" &&
      Number(deferredAmount) > 0,

    // === OPTIMAL QUOTE CONFIGURATION ===

    // Stale time: Consider quotes stale after 30 seconds
    // Crypto prices change rapidly, so quotes shouldn't be cached too long
    staleTime: 30 * 1000, // 30 seconds

    // Cache time: Keep in cache for 1 minute after component unmounts
    // Allows quick re-access if user navigates back quickly
    gcTime: 1 * 60 * 1000, // 1 minute (formerly cacheTime)

    // Background refetching: Update quotes every 30 seconds when component is active
    // Ensures users see relatively fresh quotes without manual refresh
    refetchInterval: 30 * 1000, // 30 seconds
    refetchIntervalInBackground: false, // Don't waste resources when tab inactive
  });
}
