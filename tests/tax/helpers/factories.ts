import {
  CURRENCY_INR,
  ORDER_TYPE,
  STATUS_COMPLETED,
} from "@/tax/core/subgraph/config";
import type { NormalizedOrder, RawOrder, Settings } from "@/tax/core/types";
import { D } from "@/tax/lib/decimal";
import { istToInstant } from "@/tax/lib/ist";

/** IST wall-clock "YYYY-MM-DDTHH:mm" → unix seconds string */
export function istSeconds(local: string): string {
  return String(Math.floor(istToInstant(`${local}:00`).getTime() / 1000));
}

export function istDate(local: string): Date {
  return istToInstant(`${local}:00`);
}

/** Human amount → 6-dp integer string */
export function units(amount: string | number): string {
  return new D(amount).mul(1_000_000).toFixed(0);
}

let seq = 0;
export function rawOrder(overrides: Partial<RawOrder> = {}): RawOrder {
  seq += 1;
  const ts = overrides.completedAt ?? istSeconds("2026-06-01T12:00");
  return {
    id: `0x${seq.toString(16).padStart(6, "0")}`,
    orderId: String(1000 + seq),
    type: ORDER_TYPE.BUY,
    status: STATUS_COMPLETED,
    currency: CURRENCY_INR,
    usdcAmount: units(100),
    fiatAmount: units(9000),
    actualUsdcAmount: "0",
    actualFiatAmount: "0",
    fixedFeePaid: "0",
    tipsPaid: "0",
    userAddress: `0x${"a".repeat(40)}`,
    isUserCompleted: false,
    disputeStatus: 0,
    placedAt: ts,
    completedAt: ts,
    cancelledAt: "0",
    blockTimestamp: ts,
    transactionHash: `0x${seq.toString(16).padStart(64, "0")}`,
    ...overrides,
  };
}

export function buy(
  local: string,
  usdc: number | string,
  inr: number | string,
  extra: Partial<RawOrder> = {},
): RawOrder {
  const ts = istSeconds(local);
  return rawOrder({
    type: ORDER_TYPE.BUY,
    usdcAmount: units(usdc),
    fiatAmount: units(inr),
    completedAt: ts,
    blockTimestamp: ts,
    ...extra,
  });
}

export function sell(
  local: string,
  usdc: number | string,
  inr: number | string,
  extra: Partial<RawOrder> = {},
): RawOrder {
  const ts = istSeconds(local);
  return rawOrder({
    type: ORDER_TYPE.SELL,
    usdcAmount: units(usdc),
    fiatAmount: units(inr),
    completedAt: ts,
    blockTimestamp: ts,
    ...extra,
  });
}

export function normalized(
  kind: NormalizedOrder["kind"],
  local: string,
  qty: string,
  inr: string,
): NormalizedOrder {
  seq += 1;
  return {
    id: `n${seq}`,
    orderId: String(seq),
    kind,
    date: istDate(local),
    qty: new D(qty),
    inr: new D(inr),
    feeUsdc: new D(0),
    feeInr: new D(0),
    feeQtyFromLots: new D(0),
    wallet: `0x${"a".repeat(40)}`,
    recipient: null,
    counterparty: null,
    txHash: "0x",
  };
}

export const baseSettings: Settings = {
  costMethod: "FIFO",
  costMethodLocked: false,
  userSpecifiedPerson: true,
  counterpartySpecifiedPerson: false,
  regime: "NEW",
  otherIncome: "0",
  headOfIncome: "CAPITAL_GAINS",
};
