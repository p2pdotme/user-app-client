import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { erc20Abi, formatUnits, parseUnits, zeroAddress } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";

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
const QUOTER_ADDRESS =
  "0x222cA98F00eD15B1faE10B61c277703a194cf5d2" as Address;
const QUOTER_FEE = 500;

interface CbBtcPriceSummary {
  pricePerToken: number;
  tokenDecimals: number;
  getUsdValue: (amount: bigint) => number;
  getFormattedUsdValue: (amount: bigint) => string;
}

export function useCbBtcPrice(tokenAddress: Address | undefined) {
  return useQuery<CbBtcPriceSummary>({
    queryKey: ["cbbtc-price", tokenAddress],
    enabled:
      !!tokenAddress &&
      tokenAddress.toLowerCase() !== zeroAddress.toLowerCase(),
    queryFn: async () => {
      if (!tokenAddress) {
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
        address: QUOTER_ADDRESS,
        abi: quoterAbi,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: tokenAddress,
            tokenOut: USDC_ADDRESS,
            amountIn: oneToken,
            fee: QUOTER_FEE,
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
