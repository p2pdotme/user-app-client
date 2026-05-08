import { VersionedTransaction } from "@solana/web3.js";
import { ResultAsync } from "neverthrow";
import { type AppError, createAppError } from "@/lib/errors";
import {
  JUPITER_API_BASE,
  JUPITER_API_KEY,
  JUPITER_SLIPPAGE_BPS,
  P2P_TOKEN_MINT,
  SOLANA_USDC_MINT,
} from "./config";

export interface JupiterOrderResponse {
  transaction: string; // base64-encoded VersionedTransaction ready to sign
  requestId: string;
  outAmount: string;
  inAmount: string;
  inputMint: string;
  outputMint: string;
  priceImpactPct?: string;
  routePlan?: { swapInfo: { label: string } }[];
}

function jupiterHeaders(): Record<string, string> {
  return {
    "x-api-key": JUPITER_API_KEY,
    "Content-Type": "application/json",
  };
}

export type JupiterSwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

function orderJupiter(
  inputMint: string,
  outputMint: string,
  amount: string,
  taker: string,
): ResultAsync<JupiterOrderResponse, AppError<"JupiterSwap">> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    taker,
    slippageBps: String(JUPITER_SLIPPAGE_BPS),
  });

  return ResultAsync.fromPromise(
    fetch(`${JUPITER_API_BASE}/order?${params}`, {
      headers: jupiterHeaders(),
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? `Jupiter /order failed (${res.status})`);
      }
      return body as JupiterOrderResponse;
    }),
    (error) =>
      createAppError("Failed to get Jupiter order", {
        domain: "JupiterSwap",
        code: "JupiterQuoteError",
        cause: error,
        context: { inputMint, outputMint, amount, taker },
      }),
  );
}

export function orderJupiterUsdcToP2P(
  amount: string,
  taker: string,
): ResultAsync<JupiterOrderResponse, AppError<"JupiterSwap">> {
  return orderJupiter(SOLANA_USDC_MINT, P2P_TOKEN_MINT, amount, taker);
}

export function orderJupiterP2PToUsdc(
  amount: string,
  taker: string,
): ResultAsync<JupiterOrderResponse, AppError<"JupiterSwap">> {
  return orderJupiter(P2P_TOKEN_MINT, SOLANA_USDC_MINT, amount, taker);
}

export function deserializeJupiterTransaction(
  base64Tx: string,
): ResultAsync<VersionedTransaction, AppError<"JupiterSwap">> {
  return ResultAsync.fromSafePromise(
    Promise.resolve(
      VersionedTransaction.deserialize(Buffer.from(base64Tx, "base64")),
    ),
  );
}
