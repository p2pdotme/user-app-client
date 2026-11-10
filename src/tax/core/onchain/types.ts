import type { Dec } from "@/tax/lib/decimal";

/** USDC on Base (native, Circle). Lowercase. */
export const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

/**
 * One ERC-20 token transfer touching a wallet, as read from a block explorer
 * (API or CSV export). Amounts are already scaled by the token's decimals.
 */
export interface TokenTransfer {
  txHash: string;
  time: Date;
  /** lowercase */
  from: string;
  /** lowercase */
  to: string;
  /** Token contract (lowercase) */
  token: string;
  symbol: string;
  amount: Dec;
}
