/**
 * Subgraph configuration. The schema exposes `type`, `status` and
 * `disputeStatus` as plain Int with no enum / description.
 *
 * type: confirmed by the P2P.me team (and consistent with live data):
 *   0 → BUY  : user pays INR, receives USDC. Fee is charged in INR
 *              (actualFiatAmount = fiatAmount + fee × rate).
 *   1 → SELL : user sends USDC, receives INR. Fee is charged in USDC
 *              (actualUsdcAmount = usdcAmount + fixedFeePaid).
 *   2 → PAY  : user pays a UPI merchant with USDC. Same mechanics as SELL and
 *              treated identically: a transfer of VDA, taxed like a sale, with
 *              the INR paid to the merchant as the sale consideration.
 *
 * Other values were confirmed by running scripts/inspect.ts against the live
 * P2P.me subgraph (Nov 2026):
 * status
 *   0 placed · 1 accepted · 2 paid · 3 completed (completedAt set) ·
 *   4 cancelled (cancelledAt set)
 * disputeStatus
 *   0 none · 1 raised, not settled · 2 settled (disputeSettledAt set)
 * currency
 *   bytes32, ASCII right-padded with zeros. "INR" = 0x494e52…
 * Amounts
 *   usdcAmount 6 dp (USDC on Base). fiatAmount 6 dp
 *   (e.g. 15.262515 USDC ↔ 1499999974 → ₹1,499.999974 → ₹98.28/USDC).
 * Timestamps
 *   Unix seconds (1793964567 → Nov 2026).
 */

import { SubgraphUrlSchema } from "@/tax/core/subgraph/schemas";

const DEFAULT_SUBGRAPH_URL =
  "https://api.goldsky.com/api/public/project_cmq7kbyqt81p501xi7h0wdeuh/subgraphs/p2pme-subgraph/prod/gn";

/**
 * P2P.me subgraph endpoint. Override with VITE_SUBGRAPH_URL (see .env.example).
 * Validated with zod at startup; an invalid override falls back to the default.
 */
function resolveSubgraphUrl(): string {
  const override = import.meta.env?.VITE_SUBGRAPH_URL;
  if (!override) return DEFAULT_SUBGRAPH_URL;
  const parsed = SubgraphUrlSchema.safeParse(override);
  if (parsed.success) return parsed.data;
  console.warn(
    "VITE_SUBGRAPH_URL is not a valid https URL; using the default endpoint.",
  );
  return DEFAULT_SUBGRAPH_URL;
}

export const SUBGRAPH_URL: string = resolveSubgraphUrl();

export const ORDER_TYPE = { BUY: 0, SELL: 1, PAY: 2 } as const;

export const STATUS_COMPLETED = 3;
export const STATUS_CANCELLED: readonly number[] = [4];

export const DISPUTE_STATUS = { NONE: 0, RAISED: 1, SETTLED: 2 } as const;

/** bytes32 ASCII "INR" right-padded with zeros */
export const CURRENCY_INR =
  "0x494e520000000000000000000000000000000000000000000000000000000000";

export const USDC_DECIMALS = 6;
export const FIAT_DECIMALS = 6;
export const TIMESTAMP_UNIT: "seconds" | "milliseconds" = "seconds";

export const PAGE_SIZE = 1000;
