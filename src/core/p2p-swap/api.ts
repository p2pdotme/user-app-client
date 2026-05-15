import { z } from "zod";

export type SwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

const BASE_URL = import.meta.env.VITE_P2P_SWAP_URL as string | undefined;

const StepWithTimeSchema = z.object({
  outputAmount: z.string(),
  estimatedTimeInSeconds: z.number().optional(),
});

const StepSchema = z.object({
  outputAmount: z.string(),
  note: z.string().optional(),
});

export const QuoteUsdcToP2PResponseSchema = z.object({
  status: z.literal("ok"),
  inputAmount: z.string(),
  steps: z.object({
    rangoBaseUsdcToSolanaUsdc: StepWithTimeSchema,
    jupiterSolanaUsdcToSolanaP2P: StepSchema,
    wormholeNttSolanaP2PToBaseP2P: StepSchema,
  }),
  estimatedOutputAmount: z.string(),
});

export const QuoteP2PToUsdcResponseSchema = z.object({
  status: z.literal("ok"),
  inputAmount: z.string(),
  steps: z.object({
    wormholeNttBaseP2PToSolanaP2P: StepSchema,
    jupiterSolanaP2PToSolanaUsdc: StepSchema,
    rangoSolanaUsdcToBaseUsdc: StepWithTimeSchema,
  }),
  estimatedOutputAmount: z.string(),
});

export type QuoteUsdcToP2PResponse = z.infer<typeof QuoteUsdcToP2PResponseSchema>;
export type QuoteP2PToUsdcResponse = z.infer<typeof QuoteP2PToUsdcResponseSchema>;

async function fetchJson(url: string): Promise<unknown> {
  if (!BASE_URL) throw new Error("VITE_P2P_SWAP_URL is not configured");
  const res = await fetch(url);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType || "unknown"} — check VITE_P2P_SWAP_URL`);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `Request failed: ${res.status}`);
  }
  return json;
}

export async function fetchQuoteUsdcToP2P(amountBaseUnits: string): Promise<QuoteUsdcToP2PResponse> {
  const json = await fetchJson(`${BASE_URL}/api/quote/usdc-to-p2p?amount=${amountBaseUnits}`);
  return QuoteUsdcToP2PResponseSchema.parse(json);
}

export async function fetchQuoteP2PToUsdc(amountBaseUnits: string): Promise<QuoteP2PToUsdcResponse> {
  const json = await fetchJson(`${BASE_URL}/api/quote/p2p-to-usdc?amount=${amountBaseUnits}`);
  return QuoteP2PToUsdcResponseSchema.parse(json);
}
