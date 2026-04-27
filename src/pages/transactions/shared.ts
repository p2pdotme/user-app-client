import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import moment from "moment";
import type { EnrichedSubgraphOrder } from "@/core/p2pdotme/shared/validation";
import { COUNTRY_OPTIONS, SUPPORTED_CURRENCIES } from "@/lib/constants";

// Shared Transaction interface
export interface Transaction {
  id: string;
  type: "BUY" | "SELL" | "PAY";
  cryptoAmount: number; // actualUsdcAmount from contract (after fees)
  fiatAmount: number; // actualFiatAmount from contract (after fees)
  status: "PLACED" | "ACCEPTED" | "PAID" | "COMPLETED" | "CANCELLED";
  createdAt: number;
  currency: CurrencyType;
  disputeStatus: "RAISED" | "SETTLED" | "DEFAULT";
}

// Shared TransactionFilters interface
export interface TransactionFilters {
  types: Array<"BUY" | "SELL" | "PAY">;
  statuses: Array<"PLACED" | "ACCEPTED" | "PAID" | "COMPLETED" | "CANCELLED">;
  disputeStatuses: Array<"NONE" | "RAISED" | "SETTLED" | "DEFAULT">;
  currencies: Array<CurrencyType>;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  datePreset:
    | "last7days"
    | "last30days"
    | "thisMonth"
    | "last3months"
    | "custom";
}

// Empty filters (no filtering applied)
export const EMPTY_FILTERS: TransactionFilters = {
  types: ["BUY", "SELL", "PAY"],
  statuses: ["PLACED", "ACCEPTED", "PAID", "COMPLETED", "CANCELLED"],
  disputeStatuses: ["NONE", "RAISED", "SETTLED", "DEFAULT"],
  currencies: [...SUPPORTED_CURRENCIES],
  dateRange: {},
  datePreset: "last30days",
};

// Sane default filters (all statuses + this month)
export const SANE_DEFAULT_FILTERS: TransactionFilters = {
  types: ["BUY", "SELL", "PAY"],
  statuses: ["PLACED", "ACCEPTED", "PAID", "COMPLETED", "CANCELLED"],
  disputeStatuses: ["NONE", "RAISED", "SETTLED", "DEFAULT"],
  currencies: [...SUPPORTED_CURRENCIES],
  dateRange: {},
  datePreset: "thisMonth", // This month instead of last 30 days
};

// Keep DEFAULT_FILTERS for backward compatibility
export const DEFAULT_FILTERS = EMPTY_FILTERS;

// Filter options constants
export const TRANSACTION_TYPES = [
  { value: "BUY" as const, labelKey: "BUY" },
  { value: "SELL" as const, labelKey: "SELL" },
  { value: "PAY" as const, labelKey: "PAY" },
] as const;

export const TRANSACTION_STATUSES = [
  { value: "PLACED" as const, labelKey: "PLACED" },
  { value: "ACCEPTED" as const, labelKey: "ACCEPTED" },
  { value: "PAID" as const, labelKey: "PAID" },
  { value: "COMPLETED" as const, labelKey: "COMPLETED" },
  { value: "CANCELLED" as const, labelKey: "CANCELLED" },
] as const;

export const DISPUTE_STATUSES = [
  { value: "NONE" as const, labelKey: "NO_DISPUTE" },
  { value: "RAISED" as const, labelKey: "RAISED" },
  { value: "SETTLED" as const, labelKey: "SETTLED" },
  { value: "DEFAULT" as const, labelKey: "DEFAULT" },
] as const;

export const CURRENCIES = COUNTRY_OPTIONS.map((c) => ({
  value: c.currency,
  labelKey: c.currency,
}));

export const DATE_PRESETS = [
  { value: "last7days" as const, labelKey: "LAST_7_DAYS_SHORT" },
  { value: "last30days" as const, labelKey: "LAST_30_DAYS_SHORT" },
  { value: "thisMonth" as const, labelKey: "THIS_MONTH_SHORT" },
  { value: "last3months" as const, labelKey: "LAST_3_MONTHS_SHORT" },
] as const;

// Shared utility function for date range calculation
export const getDateRangeFromPreset = (
  preset: TransactionFilters["datePreset"],
  currentFilters?: TransactionFilters,
) => {
  const now = moment();
  switch (preset) {
    case "last7days":
      return {
        from: now.clone().subtract(7, "days").startOf("day").toDate(),
        to: now.endOf("day").toDate(),
      };
    case "last30days":
      return {
        from: now.clone().subtract(30, "days").startOf("day").toDate(),
        to: now.endOf("day").toDate(),
      };
    case "thisMonth":
      return {
        from: now.clone().startOf("month").toDate(),
        to: now.endOf("month").toDate(),
      };
    case "last3months":
      return {
        from: now.clone().subtract(3, "months").startOf("month").toDate(),
        to: now.endOf("day").toDate(),
      };
    case "custom":
      return currentFilters?.dateRange || {};
    default:
      return {};
  }
};

// Shared function to transform enriched subgraph order to Transaction
export const transformSubgraphOrderToTransaction = (
  order: EnrichedSubgraphOrder,
): Transaction => {
  // Use actual amounts from contract data (after fees) only if they are greater than 0
  // If contract data is not available or values are 0, fall back to base amounts from subgraph
  const cryptoAmount =
    order.contractFeeDetails?.actualUsdtAmount &&
    order.contractFeeDetails.actualUsdtAmount > 0
      ? order.contractFeeDetails.actualUsdtAmount
      : parseFloat(order.usdcAmount);
  const fiatAmount =
    order.contractFeeDetails?.actualFiatAmount &&
    order.contractFeeDetails.actualFiatAmount > 0
      ? order.contractFeeDetails.actualFiatAmount
      : parseFloat(order.fiatAmount);

  return {
    id: order.orderId,
    type: order.type as "BUY" | "SELL" | "PAY",
    cryptoAmount,
    fiatAmount,
    status: order.status as
      | "PLACED"
      | "ACCEPTED"
      | "PAID"
      | "COMPLETED"
      | "CANCELLED",
    createdAt: parseInt(order.placedAt, 10),
    currency: order.currency as CurrencyType,
    disputeStatus: order.disputeStatus as "RAISED" | "SETTLED" | "DEFAULT",
  };
};
