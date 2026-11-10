import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllOrders, type SubgraphError } from "@/tax/core/subgraph/client";
import type { RawOrder } from "@/tax/core/types";

/**
 * Loads the full order history of every wallet in `addresses` (null → idle),
 * with live progress across all of them.
 */
export function useOrders(addresses: readonly string[] | null) {
  const [loaded, setLoaded] = useState(0);
  const query = useQuery<RawOrder[], SubgraphError>({
    queryKey: ["orders", addresses?.join(",") ?? null],
    enabled: addresses !== null && addresses.length > 0,
    staleTime: 5 * 60_000,
    // Retry network blips only; a parse or address error will not fix itself
    retry: (count, error) => error.code === "SGNetworkError" && count < 1,
    queryFn: async ({ signal }) => {
      setLoaded(0);
      const all: RawOrder[] = [];
      for (const address of addresses ?? []) {
        const before = all.length;
        const result = await fetchAllOrders(address, {
          signal,
          onProgress: (n) => setLoaded(before + n),
        });
        // React Query needs a throw to enter its error state
        if (result.isErr()) throw result.error;
        all.push(...result.value);
      }
      return all;
    },
  });
  return { ...query, loaded };
}
