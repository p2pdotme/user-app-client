import type { OrderKind } from "@/tax/core/types";

/** SELL and PAY are the same transaction for tax: a transfer of USDC for INR. */
export const isSale = (kind: OrderKind): boolean =>
  kind === "SELL" || kind === "PAY";

export const KIND_LABEL: Record<OrderKind, string> = {
  BUY: "Buy",
  SELL: "Sell",
  PAY: "Pay",
};
