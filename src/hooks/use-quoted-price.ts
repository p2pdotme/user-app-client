import { useCallback, useRef } from "react";
import { usePriceConfig } from "./use-price-config";

type PriceSide = "buy" | "sell";

/**
 * Tracks the price a user was quoted and checks it against the live price
 * right before an order is placed.
 *
 * `usePriceConfig` auto-refreshes (interval + window focus), so the price in
 * React Query can move after the user has seen a quote. The quoted price is
 * snapshotted on first availability (or whenever `markQuoted` is called) and
 * `hasPriceChanged` refetches the live price and compares it to that snapshot,
 * so a rate change surfaces the slippage drawer instead of silently placing
 * the order at the new rate.
 */
export function useQuotedPrice(side: PriceSide) {
  const { priceConfig, refetchPriceConfig } = usePriceConfig();
  const livePrice =
    side === "buy" ? priceConfig?.buyPrice : priceConfig?.sellPrice;

  const quotedRef = useRef<number | undefined>(undefined);
  // Lazy one-time snapshot of the first price the user saw.
  if (quotedRef.current === undefined && livePrice !== undefined) {
    quotedRef.current = livePrice;
  }

  /** Record the price a freshly displayed quote was computed with. */
  const markQuoted = useCallback((price: number | undefined) => {
    if (price !== undefined) quotedRef.current = price;
  }, []);

  /** Refetches the live price and reports whether it differs from the quote. */
  const hasPriceChanged = useCallback(async (): Promise<boolean> => {
    const quoted = quotedRef.current;
    if (quoted === undefined) return false;
    const { data } = await refetchPriceConfig();
    const latest = side === "buy" ? data?.buyPrice : data?.sellPrice;
    return latest !== undefined && latest !== quoted;
  }, [refetchPriceConfig, side]);

  return {
    quotedPrice: quotedRef.current ?? livePrice ?? 0,
    markQuoted,
    hasPriceChanged,
  };
}
