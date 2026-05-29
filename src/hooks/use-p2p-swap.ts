import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Address } from "thirdweb";
import { erc20Abi, parseUnits, formatUnits } from "viem";
import {
  fetchQuoteUsdcToP2P,
  fetchQuoteP2PToUsdc,
  fetchInfo,
  fetchP2PTokenInfo,
  fetchUserSwaps,
  initiateUsdcToP2PSwap,
  initiateP2PToUsdcSwap,
} from "@/core/p2p-swap";
import type { SwapDirection, SwapRecord } from "@/core/p2p-swap";
import {
  transferUSDC,
  transferP2PToken,
  viemPublicClient,
} from "@/core/adapters/thirdweb";
import { truncateAmount } from "@/lib/utils";
import { useThirdweb } from "./use-thirdweb";
import { CONTRACT_ADDRESSES } from "@/core";

const USDC_DECIMALS = 6;
const P2P_DECIMALS = 6;

// ─── Balance ──────────────────────────────────────────────────────────────────

export function useP2PBalance() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  const userAddress = account?.address as Address | undefined;

  const query = useQuery({
    queryKey: ["p2p", "balance", userAddress],
    enabled: !!userAddress,
    staleTime: 10_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const [balance, decimals] = await Promise.all([
        viemPublicClient.readContract({
          address: CONTRACT_ADDRESSES.P2P_TOKEN,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress as Address],
        }),
        viemPublicClient.readContract({
          address: CONTRACT_ADDRESSES.P2P_TOKEN,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      return { raw: balance, decimals };
    },
  });

  const refetch = () =>
    queryClient.invalidateQueries({
      queryKey: ["p2p", "balance", userAddress],
    });

  return {
    p2pBalanceRaw: query.data?.raw ?? null,
    isP2PBalanceLoading: query.isLoading,
    refetchP2PBalance: refetch,
  };
}

// ─── Token Info (Jupiter metadata via backend) ────────────────────────────────

export function useP2PTokenInfo() {
  const query = useQuery({
    queryKey: ["p2p", "token-info"],
    queryFn: fetchP2PTokenInfo,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return {
    tokenInfo: query.data ?? null,
    isTokenInfoLoading: query.isLoading,
    isTokenInfoError: query.isError,
    refetchTokenInfo: query.refetch,
  };
}

// ─── Swap Info (limits + company addresses) ───────────────────────────────────

export function useP2PSwapInfo() {
  const query = useQuery({
    queryKey: ["p2p-swap", "info"],
    queryFn: fetchInfo,
    staleTime: 5 * 60 * 1000,
  });

  const limits = query.data?.limits;
  const usdcLimit = limits
    ? Number(formatUnits(BigInt(limits.usdc), USDC_DECIMALS))
    : null;
  const p2pLimit = limits
    ? Number(formatUnits(BigInt(limits.p2p), P2P_DECIMALS))
    : null;

  return {
    info: query.data ?? null,
    usdcLimit,
    p2pLimit,
    isInfoLoading: query.isLoading,
    isInfoError: query.isError,
  };
}

// ─── Swap Quote ───────────────────────────────────────────────────────────────

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
  const isEnabled =
    !!debouncedAmount && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const query = useQuery({
    queryKey: ["p2p-swap", "quote", direction, debouncedAmount],
    enabled: isEnabled,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
  const isLowReserve =
    query.isError && query.error instanceof Error && query.error.message === "LOW_RESERVE";

  return {
    quote: query.data ?? null,
    outputAmount: isLowReserve
      ? "0"
      : truncateAmount(Number(formatUnits(BigInt(rawOutput || 0), outputDecimals))),
    isQuoteLoading: query.isLoading || query.isFetching,
    isQuoteError: query.isError,
    isLowReserve,
    quoteError: query.error,
    refetchQuote: query.refetch,
  };
}

// ─── Execute Swap ─────────────────────────────────────────────────────────────

export function useP2PSwap(direction: SwapDirection, amount: string) {
  const { account } = useThirdweb();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");

      const info = await fetchInfo();
      const companyBaseAddress = info.addresses.base as Address;

      let txnHash: string;

      if (direction === "USDC_TO_P2P") {
        const result = await transferUSDC(
          {
            address: companyBaseAddress,
            amount: parseUnits(amount, USDC_DECIMALS),
          },
          account,
        );
        if (result.isErr()) throw result.error;
        txnHash = result.value.transactionHash;
        return initiateUsdcToP2PSwap(txnHash, account.address);
      } else {
        const result = await transferP2PToken(
          {
            address: companyBaseAddress,
            amount: parseUnits(amount, P2P_DECIMALS),
          },
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

// ─── Swap History ─────────────────────────────────────────────────────────────

export function useP2PSwapHistory() {
  const { account } = useThirdweb();
  const userId = account?.address;

  const query = useQuery({
    queryKey: ["p2p-swap", "history", userId],
    enabled: !!userId,
    refetchInterval: 15_000,
    queryFn: () => fetchUserSwaps(userId!),
  });

  return {
    swaps: query.data ?? ([] as SwapRecord[]),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
