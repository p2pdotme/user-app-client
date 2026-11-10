import type { z } from "zod";
import type { RawOrderSchema } from "@/tax/core/subgraph/schemas";
import type { Dec } from "@/tax/lib/decimal";

/** Order as returned by the subgraph (privacy-safe field list only), validated by zod. */
export type RawOrder = z.infer<typeof RawOrderSchema>;

export type OrderKind = "BUY" | "SELL" | "PAY";

/** A completed INR order converted to Decimal amounts and an IST-safe date. */
export interface NormalizedOrder {
  id: string;
  orderId: string;
  kind: OrderKind;
  /** Instant of completion (UTC Date; convert to IST for display / FY). */
  date: Date;
  /** USDC acquired (BUY) or USDC transferred for the INR consideration (SELL/PAY). */
  qty: Dec;
  /** BUY: cost of acquisition (₹). SELL/PAY: sale consideration (₹). */
  inr: Dec;
  /** Platform fee + tips in USDC (non-deductible). */
  feeUsdc: Dec;
  /**
   * INR value of the platform fee + tips (non-deductible), for display.
   * BUY: the INR fee paid on top of the price. It is NOT part of the cost of
   * acquisition (s.115BBH(2)(a) allows no expense other than that cost).
   */
  feeInr: Dec;
  /** USDC that leaves the wallet as fees on SELL/PAY (consumed from lots, cost not deductible). */
  feeQtyFromLots: Dec;
  /** Wallet that placed the order (lowercase). */
  wallet: string;
  /** BUY only: where the USDC was delivered (lowercase), null if not known. */
  recipient: string | null;
  /** The other side of the trade (P2P.me merchant), null if not known. */
  counterparty: string | null;
  txHash: string;
}

export type ExclusionReason =
  | "CANCELLED"
  | "NOT_COMPLETED"
  | "DISPUTE_UNRESOLVED"
  | "NON_INR"
  | "UNKNOWN_TYPE"
  | "ZERO_AMOUNT";

export interface ExcludedOrder {
  id: string;
  orderId: string;
  kind: OrderKind | "UNKNOWN";
  reason: ExclusionReason;
  date: Date;
  qty: Dec;
  fiat: Dec;
  currency: string;
  txHash: string;
}

export type ManualLotKind = "OPENING" | "EXTERNAL";

/**
 * How USDC from outside P2P.me came in. Each has its own cost rule
 * (see rules.ts RECEIPT_COST):
 * - EXCHANGE: bought on an exchange. Cost = INR paid.
 * - OWN_WALLET: moved or bridged from the user's own wallet. Original cost carries over.
 * - SALARY: salary, freelance or business receipt. Income on receipt; cost = that value.
 * - REWARD: reward, referral, cashback or airdrop. Income on receipt; cost = that value.
 * - GIFT_RELATIVE: gift from a relative. Not taxed; cost = previous owner's cost.
 * - GIFT_NON_RELATIVE: gift from a non-relative. Taxed on receipt (and cost = value)
 *   only if the year's gifts from non-relatives (money and property, not only
 *   USDC) exceed ₹50,000; otherwise cost = previous owner's cost (s.49(1)(ii)),
 *   nil only when that is not known.
 * - UNKNOWN: cost not known, taken as ₹0 (older saved files).
 */
export type ReceiptType =
  | "EXCHANGE"
  | "OWN_WALLET"
  | "SALARY"
  | "REWARD"
  | "GIFT_RELATIVE"
  | "GIFT_NON_RELATIVE"
  | "UNKNOWN";

/** User-entered USDC lot (stored as strings so it serialises to JSON cleanly). */
export interface ManualLot {
  id: string;
  kind: ManualLotKind;
  /** IST calendar date, YYYY-MM-DD */
  date: string;
  qty: string;
  /** Total ₹ for the lot: price paid, original cost, or value on receipt (by `source`) */
  cost: string;
  /** How the USDC came in; decides the cost rule */
  source: ReceiptType;
  /** true when the user does not know the cost → cost treated as ₹0 */
  costUnknown: boolean;
  /**
   * GIFT_NON_RELATIVE only: total ₹ the giver paid. Used as cost when the gift
   * is not taxed on receipt. Blank = not known (cost nil).
   */
  giverCost?: string;
  note: string;
  /**
   * On-chain receipt this lot records (from the on-chain check), so the same
   * deposit is not entered twice. Absent for lots typed in by hand.
   */
  txRef?: string;
}

/**
 * What happened to USDC that left the taxpayer's wallets outside P2P.me
 * (found by the on-chain check):
 * - OWN: moved to the user's own wallet, exchange account or another chain.
 *   Not a transfer; any later sale there is reported separately.
 * - SOLD: sold, or paid for goods or services, outside P2P.me. A transfer of
 *   VDA; the consideration is the INR value received.
 * - GIFT: given away. The USDC leaves the user's holdings with no
 *   consideration, so there is no income for the giver.
 */
export type OutflowTreatment = "OWN" | "SOLD" | "GIFT";

/** User's answer for one on-chain outflow (stored as strings for JSON). */
export interface OutflowEntry {
  /** Stable id of the on-chain movement (see core/onchain/reconcile.ts) */
  id: string;
  txHash: string;
  /** ISO instant of the transfer */
  at: string;
  /** USDC sent */
  qty: string;
  /** Receiving address (lowercase) */
  to: string;
  treatment: OutflowTreatment;
  /** SOLD only: INR value received (₹) */
  consideration: string;
}

export interface TdsEntry {
  id: string;
  /** IST calendar date, YYYY-MM-DD (decides the FY of the credit) */
  date: string;
  amount: string;
  /** Form 26AS / AIS reference (e.g. deductor TAN, Form 16E no.) */
  reference: string;
}

/**
 * FIFO: oldest lot first (default). LIFO: newest lot first.
 * SPECIFIC: the lot the user tags against each sale, then FIFO for the rest.
 * AVERAGE: running weighted-average cost of all USDC held.
 */
export type CostMethod = "FIFO" | "LIFO" | "SPECIFIC" | "AVERAGE";
export type TaxRegime = "NEW" | "OLD";
export type HeadOfIncome = "CAPITAL_GAINS" | "BUSINESS";

export interface Settings {
  costMethod: CostMethod;
  /** Once locked the method cannot change; it must be used every year. */
  costMethodLocked: boolean;
  /** Buyer side: the user (as payer) is a "specified person" → ₹50,000 limit. */
  userSpecifiedPerson: boolean;
  /** Seller side: the counterparty (payer) is a "specified person". Usually not. */
  counterpartySpecifiedPerson: boolean;
  regime: TaxRegime;
  /** Total income other than VDA income, in ₹ (string, user-entered). */
  otherIncome: string;
  headOfIncome: HeadOfIncome;
}

/**
 * Entries that belong to one taxpayer (one set of wallets). They are kept per
 * wallet set so an entry made for one wallet is never applied to another.
 */
export interface WalletEntries {
  lots: ManualLot[];
  tds: TdsEntry[];
  /** Addresses the user said are NOT theirs (purchases delivered there). */
  notMyWallets: string[];
  /** SPECIFIC cost method: sale (transfer id) → lot (acquisition id) it sold */
  specificLots: Record<string, string>;
  /**
   * Gifts from non-relatives in the year OTHER than the USDC entered here
   * (money and property), by FY start year. Counts towards the ₹50,000 test.
   */
  otherGifts: Record<string, string>;
  /** On-chain outflows outside P2P.me and what the user said they were */
  outflows: OutflowEntry[];
}

export interface ManualData extends WalletEntries {
  version: 1;
  settings: Settings;
  /** Wallets these entries belong to (lowercase); empty if not yet known */
  wallets: string[];
}

export type LawVersion = "ITA_1961" | "ITA_2025";
