import { err, ResultAsync } from "neverthrow";
import { RangoClient } from "rango-sdk-basic";
import { formatUnits, isAddress } from "viem";
import { type AppError, createAppError } from "@/lib/errors";
import {
  RANGO_API_KEY,
  RANGO_REFERRER_ADDRESS,
  RANGO_REFERRER_CODE,
  RANGO_REFERRER_FEE_PERCENT,
  RANGO_SLIPPAGE,
  RANGO_SWAPPER_GROUPS,
  RANGO_SWAPPER_GROUPS_EXCLUDE,
} from "./config";
import type {
  BridgeChain,
  BridgeToken,
  QuoteRequest,
  RangoQuoteResponse,
  RangoSwapResponse,
  SupportedBridgeChains,
  SwapRequest,
  TokenBalanceResponse,
} from "./types";

const rangoApiKey = RANGO_API_KEY;
if (!rangoApiKey) {
  throw new Error(
    "RANGO_API_KEY is missing. Please set VITE_RANGO_API_KEY in environment.",
  );
}
export const rango = new RangoClient(rangoApiKey);

export function fetchWalletTokensByChain(
  address: string,
  chain: SupportedBridgeChains,
  bridgeMeta: BridgeChain[],
): ResultAsync<BridgeToken[], AppError<"RangoDeposit" | "RangoWithdraw">> {
  // Validate address for non-Solana chains
  if (!isAddress(address) && chain !== "SOLANA") {
    return ResultAsync.fromSafePromise(Promise.resolve()).andThen(() =>
      err(
        createAppError("Invalid address for non-Solana chain", {
          domain: "RangoDeposit",
          code: "RangoBalanceFetchError",
          cause: new Error("Invalid address format"),
          context: { address, chain },
        }),
      ),
    );
  }

  // Find the chain metadata for this chain
  const chainMeta = bridgeMeta.find((c) => c.id === chain);
  if (!chainMeta) {
    return ResultAsync.fromSafePromise(Promise.resolve()).andThen(() =>
      err(
        createAppError(`Chain metadata not found for ${chain}`, {
          domain: "RangoDeposit",
          code: "RangoBalanceFetchError",
          cause: new Error(`Unsupported chain: ${chain}`),
          context: { address, chain },
        }),
      ),
    );
  }

  // Create parallel token data requests for each token
  const tokenDataRequests = chainMeta.tokens.map((tokenMeta) =>
    ResultAsync.fromPromise(
      rango.tokenBalance({
        walletAddress: address,
        blockchain: chain,
        symbol: tokenMeta.symbol,
        address: tokenMeta.address,
      }),
      (error) =>
        createAppError(`Failed to fetch ${tokenMeta.symbol} data`, {
          domain: "RangoDeposit",
          code: "RangoBalanceFetchError",
          cause: error,
          context: {
            address,
            chain,
            symbol: tokenMeta.symbol,
            tokenAddress: tokenMeta.address,
          },
        }),
    )
      .map((res) => {
        return {
          tokenMeta,
          balance: res.balance || "0",
          price: (res as TokenBalanceResponse).price,
        };
      })
      .map(({ tokenMeta, balance, price }) => {
        // Format the balance using proper decimals
        const formattedBalance = (() => {
          try {
            return formatUnits(BigInt(balance), tokenMeta.decimals);
          } catch {
            return "0";
          }
        })();

        // Calculate USD balance (balance * price)
        const usdBalance = (() => {
          try {
            const balanceNum = Number(formattedBalance);
            const priceNum = price ?? 0;
            return (balanceNum * priceNum).toFixed(2);
          } catch {
            return "0.00";
          }
        })();

        // Return the enriched token with all data
        return {
          ...tokenMeta,
          balance: formattedBalance,
          price: price ?? 0,
          usdBalance,
        } satisfies BridgeToken;
      }),
  );

  // Execute all token data requests in parallel and combine results
  return ResultAsync.combine(tokenDataRequests);
}

export function quoteRango(
  type: "DEPOSIT" | "WITHDRAW",
  token: {
    blockchain: string;
    address: string | null;
  },
  amount: string,
): ResultAsync<RangoQuoteResponse, AppError<"RangoDeposit" | "RangoWithdraw">> {
  const BASE_USDC = {
    blockchain: "BASE",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official Circle USDC
  };

  const quoteBody: QuoteRequest = {
    from: type === "DEPOSIT" ? token : BASE_USDC,
    to: type === "DEPOSIT" ? BASE_USDC : token,
    amount,
    slippage: RANGO_SLIPPAGE,
    avoidNativeFee: type === "WITHDRAW",
    contractCall: type === "WITHDRAW",
    referrerCode: RANGO_REFERRER_CODE,
    referrerFee: RANGO_REFERRER_FEE_PERCENT,
    swapperGroups: RANGO_SWAPPER_GROUPS,
    swappersGroupsExclude: RANGO_SWAPPER_GROUPS_EXCLUDE,
  };

  return ResultAsync.fromPromise(rango.quote(quoteBody), (error) =>
    createAppError("Failed to get quote from Rango", {
      domain: type === "DEPOSIT" ? "RangoDeposit" : "RangoWithdraw",
      code: "RangoQuoteError",
      cause: error,
      context: { quoteBody },
    }),
  );
}

export function swapRango(
  type: "DEPOSIT" | "WITHDRAW",
  token: {
    blockchain: string;
    address: string | null;
  },
  amount: string,
  fromAddress: string,
  toAddress: string,
): ResultAsync<RangoSwapResponse, AppError<"RangoDeposit" | "RangoWithdraw">> {
  const BASE_USDC = {
    blockchain: "BASE",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official Circle USDC
  };

  const swapBody: SwapRequest = {
    from: type === "DEPOSIT" ? token : BASE_USDC,
    to: type === "DEPOSIT" ? BASE_USDC : token,
    amount,
    fromAddress,
    toAddress,
    slippage: RANGO_SLIPPAGE,
    avoidNativeFee: type === "WITHDRAW",
    contractCall: type === "WITHDRAW",
    referrerCode: RANGO_REFERRER_CODE,
    referrerFee: String(RANGO_REFERRER_FEE_PERCENT),
    referrerAddress: RANGO_REFERRER_ADDRESS,
    swapperGroups: RANGO_SWAPPER_GROUPS,
    swappersGroupsExclude: RANGO_SWAPPER_GROUPS_EXCLUDE,
  };

  return ResultAsync.fromPromise(rango.swap(swapBody), (error) =>
    createAppError("Failed to execute swap with Rango", {
      domain: type === "DEPOSIT" ? "RangoDeposit" : "RangoWithdraw",
      code: "RangoSwapError",
      cause: error,
      context: { swapBody },
    }),
  );
}
