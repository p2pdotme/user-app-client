import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import {
  fetchQuoteUsdcToP2P,
  fetchQuoteP2PToUsdc,
  fetchCompanyAddresses,
  initiateUsdcToP2PSwap,
  initiateP2PToUsdcSwap,
  claimRefund,
} from "@/core/p2p-swap";
import { transferUSDC, transferP2PToken } from "@/core/adapters/thirdweb";
import type { SwapDirection } from "@/core/p2p-swap";
import { truncateAmount } from "@/lib/utils";
import { useThirdweb } from "./use-thirdweb";
import { Address } from "thirdweb";

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

export function useP2PSwap(direction: SwapDirection, amount: string) {
  const { account } = useThirdweb();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");

      const companyAddresses = await fetchCompanyAddresses();
      const companyBaseAddress = companyAddresses.base as Address;

      let txnHash: string;

      if (direction === "USDC_TO_P2P") {
        const result = await transferUSDC(
          { address: companyBaseAddress, amount: parseUnits(amount, USDC_DECIMALS) },
          account,
        );
        if (result.isErr()) throw result.error;
        txnHash = result.value.transactionHash;
        return initiateUsdcToP2PSwap(txnHash, account.address);
      } else {
        const result = await transferP2PToken(
          { address: companyBaseAddress, amount: parseUnits(amount, P2P_DECIMALS) },
          account,
        );
        if (result.isErr()) throw result.error;
        txnHash = result.value.transactionHash;
        return initiateP2PToUsdcSwap(txnHash, account.address);
      }
    },
  });

  return {
    executeSwap: mutation.mutate,
    isSwapping: mutation.isPending,
    swapData: mutation.data ?? null,
    swapError: mutation.error,
    isSwapError: mutation.isError,
    isSwapSuccess: mutation.isSuccess,
    resetSwap: mutation.reset,
  };
}

export function useClaimRefund() {
  const mutation = useMutation({
    mutationFn: (swapId: number) => claimRefund(swapId),
  });

  return {
    claimRefund: mutation.mutate,
    isClaiming: mutation.isPending,
    claimData: mutation.data ?? null,
    claimError: mutation.error,
    isClaimError: mutation.isError,
    isClaimSuccess: mutation.isSuccess,
    resetClaim: mutation.reset,
  };
}
