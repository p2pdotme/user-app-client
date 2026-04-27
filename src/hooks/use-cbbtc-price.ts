import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { erc20Abi, formatUnits, parseUnits, zeroAddress } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { useCashbackConfig } from "./use-cashback-config";

const quoterAbi = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const USDC_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS_USDC as Address;
const USDC_DECIMALS = 6;

interface CbBtcPriceSummary {
  pricePerToken: number;
  tokenDecimals: number;
  getUsdValue: (amount: bigint) => number;
  getFormattedUsdValue: (amount: bigint) => string;
}

export function useCbBtcPrice() {
  const { data: cashbackConfig, isLoading: isConfigLoading } =
    useCashbackConfig();

  const tokenAddress = cashbackConfig?.cashbackToken as Address | undefined;
  const quoterAddress = cashbackConfig?.quoterAddress as Address | undefined;
  const quoterFee = cashbackConfig?.quoterFee;

  return useQuery<CbBtcPriceSummary>({
    queryKey: ["cbbtc-price", tokenAddress, quoterAddress, quoterFee],
    enabled:
      !!tokenAddress &&
      !!quoterAddress &&
      !!quoterFee &&
      tokenAddress.toLowerCase() !== zeroAddress.toLowerCase() &&
      quoterAddress.toLowerCase() !== zeroAddress.toLowerCase() &&
      !isConfigLoading,
    queryFn: async () => {
      if (!tokenAddress || !quoterAddress || !quoterFee) {
        return {
          pricePerToken: 0,
          tokenDecimals: 8,
          getUsdValue: () => 0,
          getFormattedUsdValue: () => "$0",
        };
      }

      const tokenDecimals = await viemPublicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      });

      const oneToken = parseUnits("1", tokenDecimals);

      const { result } = await viemPublicClient.simulateContract({
        address: quoterAddress,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: tokenAddress,
            tokenOut: USDC_ADDRESS,
            amountIn: oneToken,
            fee: quoterFee,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });

      const usdcAmountOut = result[0];
      const pricePerToken = Number(formatUnits(usdcAmountOut, USDC_DECIMALS));

      return {
        pricePerToken,
        tokenDecimals,
        getUsdValue: (amount: bigint) => {
          if (amount === 0n) return 0;
          const tokenAmount = Number(formatUnits(amount, tokenDecimals));
          return tokenAmount * pricePerToken;
        },
        getFormattedUsdValue: (amount: bigint) => {
          if (amount === 0n) return "$0";
          const tokenAmount = Number(formatUnits(amount, tokenDecimals));
          const usdValue = tokenAmount * pricePerToken;
          return `~$${usdValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: usdValue < 1 ? 2 : 0,
          })}`;
        },
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
