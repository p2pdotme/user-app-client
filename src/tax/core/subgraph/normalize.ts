import { type Hex, hexToString } from "viem";
/**
 * Raw subgraph orders → normalised INR orders + excluded orders.
 *
 * Fee mechanics (confirmed in scripts/inspect.ts):
 *   BUY  : fee charged in INR → actualFiatAmount = fiatAmount + fee × rate.
 *          Cost of acquisition is the price of the USDC (fiatAmount). The INR
 *          fee is a charge for the platform's service, an expense other than
 *          cost of acquisition, so it is NOT added to cost (s.115BBH(2)(a)).
 *   SELL / PAY : fee charged in USDC → actualUsdcAmount = usdcAmount + fee.
 *          The INR consideration is for (actualUsdcAmount − fee). The fee USDC
 *          still leaves the wallet (consumed from lots) but its cost is NOT
 *          deducted from the gain.
 */
import {
  CURRENCY_INR,
  DISPUTE_STATUS,
  FIAT_DECIMALS,
  ORDER_TYPE,
  STATUS_CANCELLED,
  STATUS_COMPLETED,
  USDC_DECIMALS,
} from "@/tax/core/subgraph/config";
import type {
  ExcludedOrder,
  ExclusionReason,
  NormalizedOrder,
  OrderKind,
  RawOrder,
} from "@/tax/core/types";
import {
  D,
  type Dec,
  decMax,
  decMin,
  fromUnits,
  ZERO,
} from "@/tax/lib/decimal";
import { timestampToDate } from "@/tax/lib/fy";

export interface NormalizeResult {
  orders: NormalizedOrder[];
  excluded: ExcludedOrder[];
}

/** bytes32 currency code → ASCII ("0x494e52…" → "INR"), via viem like user-app-client. */
export function decodeCurrency(hex: string): string {
  try {
    return hexToString(hex as Hex, { size: 32 });
  } catch {
    return "";
  }
}

export function kindOf(type: number): OrderKind | null {
  if (type === ORDER_TYPE.BUY) return "BUY";
  if (type === ORDER_TYPE.SELL) return "SELL";
  if (type === ORDER_TYPE.PAY) return "PAY";
  return null;
}

/** completedAt if set, else blockTimestamp, else placedAt. */
export function orderDate(raw: RawOrder): Date {
  return (
    timestampToDate(raw.completedAt) ??
    timestampToDate(raw.blockTimestamp) ??
    timestampToDate(raw.placedAt) ??
    new Date(0)
  );
}

const ZERO_ADDRESS = `0x${"0".repeat(40)}`;

/** Lowercased address, or null when missing / the zero address. */
export function addressOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  return lower === ZERO_ADDRESS || !/^0x[0-9a-f]{40}$/.test(lower)
    ? null
    : lower;
}

const nonZeroOr = (primary: Dec, fallback: Dec): Dec =>
  primary.isZero() ? fallback : primary;

function exclusionReason(
  raw: RawOrder,
  kind: OrderKind | null,
): ExclusionReason | null {
  if (kind === null) return "UNKNOWN_TYPE";
  if (STATUS_CANCELLED.includes(raw.status)) return "CANCELLED";
  if (raw.status !== STATUS_COMPLETED) return "NOT_COMPLETED";
  if (raw.disputeStatus === DISPUTE_STATUS.RAISED) return "DISPUTE_UNRESOLVED";
  if (raw.currency.toLowerCase() !== CURRENCY_INR) return "NON_INR";
  return null;
}

interface Amounts {
  qty: Dec;
  inr: Dec;
  feeUsdc: Dec;
  feeInr: Dec;
  feeQtyFromLots: Dec;
}

function buyAmounts(raw: RawOrder): Amounts {
  const usdc = fromUnits(raw.usdcAmount, USDC_DECIMALS);
  const qty = nonZeroOr(fromUnits(raw.actualUsdcAmount, USDC_DECIMALS), usdc);
  const fiat = fromUnits(raw.fiatAmount, FIAT_DECIMALS);
  const gross = nonZeroOr(fromUnits(raw.actualFiatAmount, FIAT_DECIMALS), fiat);
  const feeUsdc = fromUnits(raw.fixedFeePaid, USDC_DECIMALS).plus(
    fromUnits(raw.tipsPaid, USDC_DECIMALS),
  );
  // Fee charged in INR on top of the price → keep it out of cost.
  if (!fiat.isZero() && gross.greaterThan(fiat)) {
    return {
      qty,
      inr: fiat,
      feeUsdc,
      feeInr: gross.minus(fiat),
      feeQtyFromLots: ZERO,
    };
  }
  const rate = qty.isZero() ? ZERO : gross.div(qty);
  return {
    qty,
    inr: gross,
    feeUsdc,
    feeInr: feeUsdc.mul(rate),
    feeQtyFromLots: ZERO,
  };
}

function transferAmounts(raw: RawOrder): Amounts {
  const usdc = fromUnits(raw.usdcAmount, USDC_DECIMALS);
  const actual = fromUnits(raw.actualUsdcAmount, USDC_DECIMALS);
  const gross = nonZeroOr(actual, usdc);
  const fee = fromUnits(raw.fixedFeePaid, USDC_DECIMALS);
  const tips = fromUnits(raw.tipsPaid, USDC_DECIMALS);
  // Part of `gross` that is the platform fee (actual = usdcAmount + fee).
  const feeInGross = usdc.isZero()
    ? ZERO
    : decMin(fee, decMax(gross.minus(usdc), ZERO));
  const qty = gross.minus(feeInGross);
  const inr = nonZeroOr(
    fromUnits(raw.actualFiatAmount, FIAT_DECIMALS),
    fromUnits(raw.fiatAmount, FIAT_DECIMALS),
  );
  const feeUsdc = fee.plus(tips);
  const rate = qty.isZero() ? ZERO : inr.div(qty);
  return {
    qty,
    inr,
    feeUsdc,
    feeInr: feeUsdc.mul(rate),
    feeQtyFromLots: feeUsdc,
  };
}

function excludedFrom(
  raw: RawOrder,
  kind: OrderKind | null,
  reason: ExclusionReason,
): ExcludedOrder {
  return {
    id: raw.id,
    orderId: raw.orderId,
    kind: kind ?? "UNKNOWN",
    reason,
    date: orderDate(raw),
    qty: nonZeroOr(
      fromUnits(raw.actualUsdcAmount, USDC_DECIMALS),
      fromUnits(raw.usdcAmount, USDC_DECIMALS),
    ),
    fiat: nonZeroOr(
      fromUnits(raw.actualFiatAmount, FIAT_DECIMALS),
      fromUnits(raw.fiatAmount, FIAT_DECIMALS),
    ),
    currency: decodeCurrency(raw.currency),
    txHash: raw.transactionHash,
  };
}

export function normalizeOrder(raw: RawOrder): NormalizedOrder | ExcludedOrder {
  const kind = kindOf(raw.type);
  const reason = exclusionReason(raw, kind);
  if (reason !== null || kind === null)
    return excludedFrom(raw, kind, reason ?? "UNKNOWN_TYPE");

  const amounts = kind === "BUY" ? buyAmounts(raw) : transferAmounts(raw);
  if (amounts.qty.lessThanOrEqualTo(0) || amounts.inr.lessThanOrEqualTo(0)) {
    return excludedFrom(raw, kind, "ZERO_AMOUNT");
  }
  return {
    id: raw.id,
    orderId: raw.orderId,
    kind,
    date: orderDate(raw),
    txHash: raw.transactionHash,
    wallet: raw.userAddress.toLowerCase(),
    recipient: kind === "BUY" ? addressOrNull(raw.usdcRecipientAddress) : null,
    counterparty: addressOrNull(raw.acceptedMerchantAddress),
    ...amounts,
  };
}

function isExcluded(o: NormalizedOrder | ExcludedOrder): o is ExcludedOrder {
  return "reason" in o;
}

export function normalizeOrders(raws: readonly RawOrder[]): NormalizeResult {
  const results = raws.map(normalizeOrder);
  const byDate = (a: { date: Date }, b: { date: Date }): number =>
    a.date.getTime() - b.date.getTime();
  return {
    orders: results
      .filter((r): r is NormalizedOrder => !isExcluded(r))
      .sort(byDate),
    excluded: results.filter(isExcluded).sort(byDate),
  };
}

/** Unit price ₹/USDC, for display. */
export function rateOf(order: Pick<NormalizedOrder, "qty" | "inr">): Dec {
  return order.qty.isZero() ? new D(0) : order.inr.div(order.qty);
}
