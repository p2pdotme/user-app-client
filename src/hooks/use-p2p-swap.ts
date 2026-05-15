import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import { fetchQuoteUsdcToP2P, fetchQuoteP2PToUsdc } from "@/core/p2p-swap";
import type { SwapDirection } from "@/core/p2p-swap";
import { truncateAmount } from "@/lib/utils";

const USDC_DECIMALS = 6;
const P2P_DECIMALS = 6;

export function useP2PSwapQuote(direction: SwapDirection, amount: string) {
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amount), 1000);
    return () => clearTimeout(timer);
  }, [amount]);

  const isUsdcToP2P = direction === "USDC_TO_P2P";
  const inputDecimals = isUsdcToP2P ? USDC_DECIMALS : P2P_DECIMALS;
  const outputDecimals = isUsdcToP2P ? P2P_DECIMALS : USDC_DECIMALS;

  const parsedAmount = Number(debouncedAmount);
  const isEnabled = !!debouncedAmount && !Number.isNaN(parsedAmount) && parsedAmount > 0;


  const query = useQuery({
    queryKey: ["p2p-swap", "quote", direction, debouncedAmount],
    enabled: isEnabled,
    queryFn: async () => {
      const amountBaseUnits = parseUnits(
        debouncedAmount.replace(/\.$/, ""),
        inputDecimals,
      ).toString();
      if (isUsdcToP2P) {
        return fetchQuoteUsdcToP2P(amountBaseUnits);
      }
      return fetchQuoteP2PToUsdc(amountBaseUnits);
    },
  });

  const rawOutput = query.data?.estimatedOutputAmount;

  return {
    quote: query.data ?? null,
    outputAmount: truncateAmount(Number(formatUnits(BigInt(rawOutput || 0), outputDecimals))),
    isQuoteLoading: query.isLoading || query.isFetching,
    isQuoteError: query.isError,
    quoteError: query.error,
  };
}
