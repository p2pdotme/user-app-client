/**
 * Cost-of-acquisition matching (pure). Lots carry across financial years.
 *
 * FIFO (default): each sale consumes the oldest lots first; cost = cost of those lots.
 * LIFO: each sale consumes the newest lots held at the time of the sale.
 * SPECIFIC: the sale consumes the lot the user tagged against it, then FIFO
 *   for any quantity that lot does not cover.
 * AVERAGE: cost = qty × running weighted-average cost of all USDC held. Lots are
 *   still consumed oldest-first purely to report acquisition dates in Schedule VDA.
 *
 * Income is worked out per sale (the transfer): consideration less the cost of
 * all the USDC sold, and a loss is taken at nil for that sale (s.115BBH). The
 * lot-wise Schedule VDA rows share that income in proportion to quantity, so
 * they add up to the sale's income and a loss-making sale shows nil on every row.
 *
 * Only cost of acquisition is deductible (rules.ts → COST_ONLY). The USDC paid as
 * platform fee on a sale is removed from holdings but its cost is NOT deducted.
 */

import type { CostMethod, ReceiptType } from "@/tax/core/types";
import { type Dec, decMax, decMin, sum, ZERO } from "@/tax/lib/decimal";

/** P2P.me purchase, or how outside USDC came in (manual entry). */
export type LotSource = "P2P" | ReceiptType;

export interface Acquisition {
  id: string;
  date: Date;
  qty: Dec;
  cost: Dec;
  source: LotSource;
  /** Cost unknown → entered as ₹0 (warning shown). */
  costUnknown: boolean;
}

/**
 * SELL / PAY: a P2P.me order. TRANSFER_OUT: USDC sold or spent outside P2P.me
 * (from the on-chain check). GIFT_OUT: USDC given away; it leaves the
 * holdings with no consideration and is not a taxable sale.
 */
export type TransferKind = "SELL" | "PAY" | "TRANSFER_OUT" | "GIFT_OUT";

export interface Transfer {
  id: string;
  /** P2P.me order number, or "On-chain 0x1234…abcd" for an outside transfer */
  orderId: string;
  kind: TransferKind;
  date: Date;
  /** USDC transferred for the consideration */
  qty: Dec;
  consideration: Dec;
  /** USDC paid as fees/tips, removed from holdings, cost not deductible */
  feeQty: Dec;
  txHash: string;
}

export interface LotMatch {
  lotId: string;
  source: LotSource;
  acquiredAt: Date;
  qty: Dec;
  cost: Dec;
}

/**
 * One Schedule VDA row: the part of a sale that used one purchase lot.
 * Consideration, income and loss are shared pro rata by quantity.
 */
export interface DisposalRow {
  /** null when no purchase covers this part (cost taken as ₹0) */
  acquiredAt: Date | null;
  source: LotSource | null;
  qty: Dec;
  cost: Dec;
  consideration: Dec;
  /** This row's share of the sale's income (never negative) */
  income: Dec;
  /** This row's share of the sale's loss (memorandum only; ignored by law) */
  loss: Dec;
}

export interface Disposal {
  transfer: Transfer;
  matches: LotMatch[];
  /** Lot-wise split used for Schedule VDA */
  rows: DisposalRow[];
  /** Income from this sale: gain, or nil on a loss */
  taxable: Dec;
  /** Loss on this sale, as a positive number (ignored by law) */
  ignoredLoss: Dec;
  /** Cost of acquisition deducted (excludes fee USDC) */
  cost: Dec;
  gain: Dec;
  /** USDC sold that could not be matched to any lot (cost taken as ₹0) */
  shortfallQty: Dec;
  /** USDC paid as fee that could not be matched to any lot */
  feeShortfallQty: Dec;
  /** Cost of the USDC paid as fee. NOT deducted, shown for information */
  feeCost: Dec;
  /** SPECIFIC only: lots held just before this sale (to choose from) */
  lotsHeld?: OpenLot[];
}

export interface OpenLot {
  lot: Acquisition;
  remaining: Dec;
}

export interface MatchResult {
  disposals: Disposal[];
  openLots: OpenLot[];
  holdingQty: Dec;
  holdingCost: Dec;
}

type Event =
  | { kind: "ACQ"; acq: Acquisition }
  | { kind: "XFER"; xfer: Transfer };

const eventDate = (e: Event): number =>
  (e.kind === "ACQ" ? e.acq.date : e.xfer.date).getTime();
const eventId = (e: Event): string => (e.kind === "ACQ" ? e.acq.id : e.xfer.id);

/** Sort by date; ties → acquisitions before transfers; then by id for stability. */
export function sortEvents(
  acqs: readonly Acquisition[],
  xfers: readonly Transfer[],
): Event[] {
  const events: Event[] = [
    ...acqs.map((acq): Event => ({ kind: "ACQ", acq })),
    ...xfers.map((xfer): Event => ({ kind: "XFER", xfer })),
  ];
  return events.sort((a, b) => {
    const dt = eventDate(a) - eventDate(b);
    if (dt !== 0) return dt;
    if (a.kind !== b.kind) return a.kind === "ACQ" ? -1 : 1;
    return eventId(a) < eventId(b) ? -1 : eventId(a) > eventId(b) ? 1 : 0;
  });
}

function lotUnitCost(lot: Acquisition): Dec {
  return lot.qty.isZero() ? ZERO : lot.cost.div(lot.qty);
}

/**
 * Holdings ledger. Internal mutable state is confined to one matchLots() call,
 * so matchLots stays a pure function.
 */
class Ledger {
  private open: { lot: Acquisition; remaining: Dec }[] = [];
  qty: Dec = ZERO;
  cost: Dec = ZERO;
  private readonly method: CostMethod;

  constructor(method: CostMethod) {
    this.method = method;
  }

  add(acq: Acquisition): void {
    this.open.push({ lot: acq, remaining: acq.qty });
    this.qty = this.qty.plus(acq.qty);
    this.cost = this.cost.plus(acq.cost);
  }

  /** Order in which open lots are consumed (indexes into `open`). */
  private order(preferLotId: string | undefined): number[] {
    const idx = this.open.map((_, i) => i);
    if (this.method === "LIFO") idx.reverse();
    if (preferLotId === undefined) return idx;
    const tagged = idx.filter((i) => this.open[i].lot.id === preferLotId);
    return [
      ...tagged,
      ...idx.filter((i) => this.open[i].lot.id !== preferLotId),
    ];
  }

  /** Remove `qty` USDC in the method's order (tagged lot first, if any). */
  take(
    qty: Dec,
    preferLotId?: string,
  ): { matches: LotMatch[]; cost: Dec; shortfall: Dec } {
    const avg = this.qty.isZero() ? ZERO : this.cost.div(this.qty);
    const matches: LotMatch[] = [];
    const left = this.open.map((o) => o.remaining);
    let need = qty;
    for (const i of this.order(preferLotId)) {
      if (need.lessThanOrEqualTo(0)) break;
      const o = this.open[i];
      const used = decMin(left[i], need);
      if (used.lessThanOrEqualTo(0)) continue;
      const unit = this.method === "AVERAGE" ? avg : lotUnitCost(o.lot);
      matches.push({
        lotId: o.lot.id,
        source: o.lot.source,
        acquiredAt: o.lot.date,
        qty: used,
        cost: used.mul(unit),
      });
      need = need.minus(used);
      left[i] = left[i].minus(used);
    }
    this.open = this.open
      .map((o, i) => ({ lot: o.lot, remaining: left[i] }))
      .filter((o) => o.remaining.greaterThan(0));
    const cost = matches.reduce<Dec>((acc, m) => acc.plus(m.cost), ZERO);
    this.qty = this.qty.minus(qty.minus(need));
    this.cost =
      this.open.length === 0 || this.qty.lessThanOrEqualTo(0)
        ? ZERO
        : this.cost.minus(cost);
    if (this.qty.lessThan(0)) this.qty = ZERO;
    return { matches, cost, shortfall: need.greaterThan(0) ? need : ZERO };
  }

  openLots(): OpenLot[] {
    return this.open.map((o) => ({ lot: o.lot, remaining: o.remaining }));
  }
}

/** Share `total` across `weights` pro rata; the last share takes the remainder. */
function shareByQty(total: Dec, weights: readonly Dec[], whole: Dec): Dec[] {
  let allocated = ZERO;
  return weights.map((w, i) => {
    const part =
      i === weights.length - 1
        ? total.minus(allocated)
        : whole.isZero()
          ? ZERO
          : total.mul(w).div(whole);
    allocated = allocated.plus(part);
    return part;
  });
}

/**
 * Split a sale lot-wise for Schedule VDA. Each row carries one acquisition
 * date, its own cost and a pro-rata share of the consideration. The sale's
 * income (nil on a loss) and its loss are shared across the rows by quantity,
 * so the rows add up to the sale's figures.
 */
export function splitIntoRows(
  xfer: Transfer,
  matches: readonly LotMatch[],
  shortfall: Dec,
): DisposalRow[] {
  const parts: {
    acquiredAt: Date | null;
    source: LotSource | null;
    qty: Dec;
    cost: Dec;
  }[] = [
    ...matches.map((m) => ({
      acquiredAt: m.acquiredAt,
      source: m.source,
      qty: m.qty,
      cost: m.cost,
    })),
    ...(shortfall.greaterThan(0)
      ? [{ acquiredAt: null, source: null, qty: shortfall, cost: ZERO }]
      : []),
  ];
  const qtys = parts.map((p) => p.qty);
  const gain = xfer.consideration.minus(sum(parts.map((p) => p.cost)));
  const considerations = shareByQty(xfer.consideration, qtys, xfer.qty);
  const incomes = shareByQty(decMax(gain, ZERO), qtys, xfer.qty);
  const losses = shareByQty(decMax(gain.neg(), ZERO), qtys, xfer.qty);
  return parts.map((p, i) => ({
    ...p,
    consideration: considerations[i],
    income: incomes[i],
    loss: losses[i],
  }));
}

export function matchLots(
  acquisitions: readonly Acquisition[],
  transfers: readonly Transfer[],
  method: CostMethod,
  /** SPECIFIC only: transfer id → acquisition id the user says was sold */
  specificLots: Readonly<Record<string, string>> = {},
): MatchResult {
  const ledger = new Ledger(method);
  const disposals: Disposal[] = [];

  for (const ev of sortEvents(acquisitions, transfers)) {
    if (ev.kind === "ACQ") {
      ledger.add(ev.acq);
      continue;
    }
    const tagged = method === "SPECIFIC" ? specificLots[ev.xfer.id] : undefined;
    const lotsHeld = method === "SPECIFIC" ? ledger.openLots() : undefined;
    const sale = ledger.take(ev.xfer.qty, tagged);
    const fee = ledger.take(ev.xfer.feeQty);
    const gain = ev.xfer.consideration.minus(sale.cost);
    disposals.push({
      transfer: ev.xfer,
      matches: sale.matches,
      rows: splitIntoRows(ev.xfer, sale.matches, sale.shortfall),
      taxable: decMax(gain, ZERO),
      ignoredLoss: decMax(gain.neg(), ZERO),
      cost: sale.cost,
      gain,
      shortfallQty: sale.shortfall,
      feeShortfallQty: fee.shortfall,
      feeCost: fee.cost,
      ...(lotsHeld ? { lotsHeld } : {}),
    });
  }

  return {
    disposals,
    openLots: ledger.openLots(),
    holdingQty: ledger.qty,
    holdingCost: ledger.cost,
  };
}
