import { z } from "zod";

// ---------------------------------------------------------------------------
// Token registry — GET /v0/tokens
// ---------------------------------------------------------------------------

export const ZodOneClickTokenSchema = z.object({
  assetId: z.string(),
  decimals: z.number(),
  blockchain: z.string(),
  symbol: z.string(),
  price: z.number().nullish(),
  priceUpdatedAt: z.string().nullish(),
  contractAddress: z.string().nullish(),
  coingeckoId: z.string().nullish(),
});
export type OneClickToken = z.infer<typeof ZodOneClickTokenSchema>;

export const ZodOneClickTokensSchema = z.array(ZodOneClickTokenSchema);

// ---------------------------------------------------------------------------
// Quote — POST /v0/quote
// ---------------------------------------------------------------------------

export type QuoteRequest = {
  dry: boolean;
  swapType: "EXACT_INPUT";
  slippageTolerance: number; // bps
  originAsset: string;
  depositType: "ORIGIN_CHAIN";
  // Stellar only supports "MEMO"; every other chain uses "SIMPLE" (the default
  // when omitted). Deposits in MEMO mode are matched by depositAddress + memo.
  depositMode?: "SIMPLE" | "MEMO";
  destinationAsset: string;
  amount: string; // origin-asset base units
  recipient: string;
  recipientType: "DESTINATION_CHAIN";
  refundTo: string;
  refundType: "ORIGIN_CHAIN";
  deadline: string; // ISO
  appFees?: { recipient: string; fee: number }[];
};

export const ZodQuoteSchema = z.object({
  amountIn: z.string(),
  amountInFormatted: z.string(),
  amountInUsd: z.string().nullish(),
  minAmountIn: z.string().nullish(),
  amountOut: z.string(),
  amountOutFormatted: z.string(),
  amountOutUsd: z.string().nullish(),
  minAmountOut: z.string().nullish(),
  timeEstimate: z.number().nullish(), // seconds
  deadline: z.string().nullish(),
  timeWhenInactive: z.string().nullish(),
  depositAddress: z.string().nullish(), // absent when dry:true
  depositMemo: z.string().nullish(),
});
export type OneClickQuote = z.infer<typeof ZodQuoteSchema>;

export const ZodQuoteResponseSchema = z.object({
  quote: ZodQuoteSchema,
  quoteRequest: z.record(z.string(), z.unknown()).nullish(),
  signature: z.string().nullish(),
  timestamp: z.string().nullish(),
});
export type QuoteResponse = z.infer<typeof ZodQuoteResponseSchema>;

// ---------------------------------------------------------------------------
// Status — GET /v0/status?depositAddress=…
// ---------------------------------------------------------------------------

export const ONECLICK_STATUSES = [
  "PENDING_DEPOSIT",
  "KNOWN_DEPOSIT_TX",
  "PROCESSING",
  "SUCCESS",
  "INCOMPLETE_DEPOSIT",
  "REFUNDED",
  "FAILED",
] as const;
export type OneClickStatus = (typeof ONECLICK_STATUSES)[number];

export const TERMINAL_STATUSES: readonly OneClickStatus[] = [
  "SUCCESS",
  "INCOMPLETE_DEPOSIT",
  "REFUNDED",
  "FAILED",
];

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export const ZodStatusResponseSchema = z.object({
  status: z.enum(ONECLICK_STATUSES),
  updatedAt: z.string().nullish(),
  swapDetails: z
    .object({
      depositedAmountFormatted: z.string().nullish(),
      amountOutFormatted: z.string().nullish(),
      originChainTxHashes: z.array(z.unknown()).nullish(),
      destinationChainTxHashes: z.array(z.unknown()).nullish(),
      refundedAmount: z.string().nullish(),
      refundReason: z.string().nullish(),
    })
    .nullish(),
});
export type StatusResponse = z.infer<typeof ZodStatusResponseSchema>;

// ---------------------------------------------------------------------------
// Pending bridge — persisted to localStorage for refresh-resilience
// ---------------------------------------------------------------------------

export const ZodPendingBridgeSchema = z.object({
  direction: z.enum(["deposit", "withdraw"]),
  depositAddress: z.string(),
  depositMemo: z.string().optional(),
  originAsset: z.string(),
  destinationAsset: z.string(),
  amount: z.string(),
  amountInFormatted: z.string(),
  amountOutFormatted: z.string(),
  originSymbol: z.string(),
  destinationSymbol: z.string(),
  recipient: z.string(),
  refundTo: z.string(),
  deadline: z.string(),
  status: z.string(),
  createdAt: z.number(),
});
export type PendingBridge = z.infer<typeof ZodPendingBridgeSchema>;

export const ZodPendingBridgesSchema = z.record(
  z.string(),
  ZodPendingBridgeSchema,
);
export type PendingBridges = z.infer<typeof ZodPendingBridgesSchema>;
