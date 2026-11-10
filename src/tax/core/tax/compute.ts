/**
 * Financial-year tax summary (pure).
 *
 * Full history (all of the taxpayer's wallets) → lot matching across all
 * years → filter to the selected FY.
 *
 * Income is computed per sale (consideration less the cost of all the USDC
 * sold); a sale at a loss is taken at nil and never offset against another.
 * Schedule VDA splits each sale lot-wise and shares that income by quantity.
 * Tax = 30% + surcharge + 4% cess.
 */

import {
  type AdvanceTaxPlan,
  advanceTaxPlan,
} from "@/tax/core/tax/advance-tax";
import {
  type Acquisition,
  type Disposal,
  matchLots,
  type Transfer,
} from "@/tax/core/tax/lots";
import {
  CESS_RATE,
  GIFT_EXEMPT_LIMIT,
  surchargeRateFor,
  VDA_TAX_RATE,
} from "@/tax/core/tax/rules";
import {
  type BuyerAdvisory,
  buyerAdvisory,
  type SellerTdsCheck,
  sellerTdsCheck,
  type TdsItem,
  tdsCreditForFy,
  tdsCreditUntil,
} from "@/tax/core/tax/tds";
import type {
  ExcludedOrder,
  LawVersion,
  ManualLot,
  NormalizedOrder,
  OutflowEntry,
  Settings,
  TdsEntry,
} from "@/tax/core/types";
import { D, type Dec, parseAmount, sum, ZERO } from "@/tax/lib/decimal";
import { shortHash } from "@/tax/lib/format";
import {
  fyMonthKeys,
  fyOf,
  fyRange,
  istDateString,
  istDateToInstant,
  istMonthKey,
  lawForFy,
} from "@/tax/lib/fy";
import { istToInstant } from "@/tax/lib/ist";

export interface ManualLotIssue {
  id: string;
  problem: "INVALID_DATE" | "INVALID_QTY" | "INVALID_COST";
}

export interface TaxComputation {
  taxableIncome: Dec;
  ignoredLosses: Dec;
  otherIncome: Dec;
  /** Income on receipt of USDC (salary, rewards, taxable gifts) in this FY */
  receiptIncome: Dec;
  totalIncome: Dec;
  surchargeRate: Dec;
  tax: Dec;
  surcharge: Dec;
  cess: Dec;
  totalTax: Dec;
  tdsCredit: Dec;
  /** total tax − TDS credit (negative → refund) */
  netPayable: Dec;
  isRefund: boolean;
}

export interface MonthPoint {
  month: string;
  gains: Dec;
  losses: Dec;
}

/**
 * USDC that was sold/spent on P2P.me but never bought on P2P.me (or entered
 * manually). It came into the wallet from outside, so its cost is unknown.
 * Computed over the full history up to the end of the selected FY.
 */
export interface OutsideUsdc {
  /** USDC (sales + fees) not covered by any known purchase */
  missing: Dec;
  /** IST date (YYYY-MM-DD) of the first sale that ran short */
  firstShortDate: string;
  /** USDC sold or spent on P2P.me, incl. fees */
  spent: Dec;
  /** USDC from known purchases (P2P.me buys to own wallets + manual entries) */
  known: Dec;
  /** USDC bought on P2P.me only (own wallets) */
  boughtOnP2p: Dec;
  /** Average ₹/USDC of the user's P2P.me buys, if any */
  avgBuyRate: Dec | null;
}

/** P2P.me purchases whose USDC went to an address outside the taxpayer's wallets. */
export interface DeliveredElsewhere {
  address: string;
  orders: NormalizedOrder[];
  qty: Dec;
  inr: Dec;
  /** PENDING: not answered yet. NOT_MINE: user said it belongs to someone else. */
  status: "PENDING" | "NOT_MINE";
}

export type ReceiptIncomeHead = "SALARY_OR_BUSINESS" | "OTHER_SOURCES";

export interface ReceiptIncome {
  lotId: string;
  date: Date;
  source: ManualLot["source"];
  head: ReceiptIncomeHead;
  amount: Dec;
}

/** Quarter-wise accrual of VDA income, as the ITR asks for s.234C / s.425. */
export interface QuarterAccrual {
  label: string;
  income: Dec;
}

export interface FyReport {
  fy: number;
  law: LawVersion;
  /** P2P.me buys in the FY whose USDC reached one of the taxpayer's wallets */
  buys: NormalizedOrder[];
  /** Every P2P.me buy in the FY (incl. those delivered elsewhere) */
  allBuys: NormalizedOrder[];
  sells: NormalizedOrder[];
  /** Taxable transfers in the FY: P2P.me sales and outside sales */
  disposals: Disposal[];
  /** USDC sold or spent outside P2P.me in the FY (from the on-chain check) */
  outsideSales: Disposal[];
  /** USDC given away in the FY: leaves holdings, no income */
  giftsOut: Disposal[];
  /** Outflows marked as sold but without a valid INR value (left out) */
  outflowIssues: OutflowEntry[];
  usdcBought: Dec;
  usdcSold: Dec;
  inrSpent: Dec;
  inrReceived: Dec;
  /** Fees on sales: USDC fee + tips, valued in ₹ (not deductible) */
  feesInr: Dec;
  feesUsdc: Dec;
  /** INR fees on buys: not part of the cost of acquisition, not deductible */
  buyFeesInr: Dec;
  /** Cost of USDC paid as fees on sales (not deducted) */
  feeLotCost: Dec;
  tax: TaxComputation;
  monthly: MonthPoint[];
  quarters: QuarterAccrual[];
  oversold: Disposal[];
  /** Non-null when cost information is missing → ask the user before showing tax */
  outsideUsdc: OutsideUsdc | null;
  /** Buys delivered outside the taxpayer's wallets, all years up to FY end */
  deliveredElsewhere: DeliveredElsewhere[];
  receiptIncome: ReceiptIncome[];
  unknownCostLots: ManualLot[];
  manualLotIssues: ManualLotIssue[];
  /** Completed orders in other fiat currencies in this FY (not computed) */
  nonInrOrders: ExcludedOrder[];
  sellerTds: SellerTdsCheck;
  buyerTds: BuyerAdvisory;
  advanceTax: AdvanceTaxPlan;
}

export interface ReportInput {
  orders: readonly NormalizedOrder[];
  lots: readonly ManualLot[];
  tds: readonly TdsEntry[];
  settings: Settings;
  fy: number;
  /** The taxpayer's wallets (lowercase). Defaults to the wallets in `orders`. */
  wallets?: readonly string[];
  /** Addresses the user said are not theirs */
  notMyWallets?: readonly string[];
  /** SPECIFIC cost method: sale id → lot id */
  specificLots?: Readonly<Record<string, string>>;
  /** Other gifts from non-relatives (money / property) by FY, for the ₹50,000 test */
  otherGifts?: Readonly<Record<string, string>>;
  /** Orders left out by normalisation; used to list non-INR orders */
  excluded?: readonly ExcludedOrder[];
  /** On-chain outflows outside P2P.me and the user's answers */
  outflows?: readonly OutflowEntry[];
  today?: Date;
}

// ---------------------------------------------------------------------------
// Manual lots: cost depends on how the USDC came in
// ---------------------------------------------------------------------------

interface ParsedLot {
  lot: ManualLot;
  date: Date;
  qty: Dec;
  /** ₹ entered: price paid, original cost or value on receipt */
  value: Dec;
}

export function manualLotsToAcquisitions(
  lots: readonly ManualLot[],
  otherGifts: Readonly<Record<string, string>> = {},
): {
  acquisitions: Acquisition[];
  issues: ManualLotIssue[];
  receiptIncome: ReceiptIncome[];
} {
  const issues: ManualLotIssue[] = [];
  const parsed: ParsedLot[] = [];
  for (const lot of lots) {
    const date = istDateToInstant(lot.date);
    const qty = parseAmount(lot.qty);
    const unknown = lot.costUnknown || lot.source === "UNKNOWN";
    const value = unknown ? ZERO : parseAmount(lot.cost);
    if (date === null) issues.push({ id: lot.id, problem: "INVALID_DATE" });
    else if (qty === null || qty.isZero())
      issues.push({ id: lot.id, problem: "INVALID_QTY" });
    else if (value === null)
      issues.push({ id: lot.id, problem: "INVALID_COST" });
    else parsed.push({ lot, date, qty, value });
  }

  // s.56(2)(x) / s.92(2)(m): gifts from non-relatives are taxed only if the
  // year's aggregate (all money and property, not only this USDC) exceeds
  // ₹50,000; then the whole aggregate is taxed.
  const nonRelativeGiftsByFy = new Map<number, Dec>(
    Object.entries(otherGifts).flatMap(([fy, v]) => {
      const amount = parseAmount(v);
      return amount && Number.isInteger(Number(fy))
        ? [[Number(fy), amount] as const]
        : [];
    }),
  );
  for (const p of parsed) {
    if (p.lot.source !== "GIFT_NON_RELATIVE") continue;
    const fy = fyOf(p.date);
    nonRelativeGiftsByFy.set(
      fy,
      (nonRelativeGiftsByFy.get(fy) ?? ZERO).plus(p.value),
    );
  }
  const giftTaxed = (date: Date): boolean =>
    (nonRelativeGiftsByFy.get(fyOf(date)) ?? ZERO).greaterThan(
      GIFT_EXEMPT_LIMIT,
    );

  const receiptIncome: ReceiptIncome[] = [];
  const acquisitions = parsed.map(({ lot, date, qty, value }): Acquisition => {
    let cost = value;
    if (lot.source === "GIFT_NON_RELATIVE") {
      // Not taxed on receipt → cost to the previous owner (s.49(1)(ii));
      // nil only when that is not known.
      cost = giftTaxed(date)
        ? value
        : (parseAmount(lot.giverCost ?? "") ?? ZERO);
      if (giftTaxed(date)) {
        receiptIncome.push({
          lotId: lot.id,
          date,
          source: lot.source,
          head: "OTHER_SOURCES",
          amount: value,
        });
      }
    } else if (lot.source === "SALARY" || lot.source === "REWARD") {
      receiptIncome.push({
        lotId: lot.id,
        date,
        source: lot.source,
        head: lot.source === "SALARY" ? "SALARY_OR_BUSINESS" : "OTHER_SOURCES",
        amount: value,
      });
    }
    return {
      id: `manual:${lot.id}`,
      date,
      qty,
      cost,
      source: lot.costUnknown ? "UNKNOWN" : lot.source,
      costUnknown: lot.costUnknown || lot.source === "UNKNOWN",
    };
  });
  return { acquisitions, issues, receiptIncome };
}

/** Does this BUY's USDC belong to the taxpayer's own wallet pool? */
export function deliveredToOwnWallet(
  order: NormalizedOrder,
  wallets: ReadonlySet<string>,
): boolean {
  return order.recipient === null || wallets.has(order.recipient);
}

export function ordersToEvents(
  orders: readonly NormalizedOrder[],
  wallets?: ReadonlySet<string>,
): {
  acquisitions: Acquisition[];
  transfers: Transfer[];
} {
  const own = wallets ?? new Set(orders.map((o) => o.wallet));
  const acquisitions: Acquisition[] = orders
    .filter((o) => o.kind === "BUY" && deliveredToOwnWallet(o, own))
    .map((o) => ({
      id: o.id,
      date: o.date,
      qty: o.qty,
      cost: o.inr,
      source: "P2P",
      costUnknown: false,
    }));
  const transfers: Transfer[] = orders
    .filter(
      (o): o is NormalizedOrder & { kind: "SELL" | "PAY" } => o.kind !== "BUY",
    )
    .map((o) => ({
      id: o.id,
      orderId: o.orderId,
      kind: o.kind,
      date: o.date,
      qty: o.qty,
      consideration: o.inr,
      feeQty: o.feeQtyFromLots,
      txHash: o.txHash,
    }));
  return { acquisitions, transfers };
}

/**
 * On-chain outflows → transfers. Sales outside P2P.me are taxed like P2P.me
 * sales; gifts only take USDC out of the holdings. Moves to the user's own
 * accounts (or to a wallet now in the wallet set) are not transfers.
 */
export function outflowsToTransfers(
  entries: readonly OutflowEntry[],
  wallets: ReadonlySet<string>,
): { transfers: Transfer[]; issues: OutflowEntry[] } {
  const transfers: Transfer[] = [];
  const issues: OutflowEntry[] = [];
  for (const e of entries) {
    if (e.treatment === "OWN" || wallets.has(e.to.toLowerCase())) continue;
    const date = new Date(e.at);
    const qty = parseAmount(e.qty);
    const consideration =
      e.treatment === "GIFT" ? ZERO : parseAmount(e.consideration);
    if (
      Number.isNaN(date.getTime()) ||
      qty === null ||
      qty.isZero() ||
      consideration === null
    ) {
      issues.push(e);
      continue;
    }
    transfers.push({
      id: `onchain:${e.id}`,
      orderId: `On-chain ${shortHash(e.txHash)}`,
      kind: e.treatment === "GIFT" ? "GIFT_OUT" : "TRANSFER_OUT",
      date,
      qty,
      consideration,
      feeQty: ZERO,
      txHash: e.txHash,
    });
  }
  return { transfers, issues };
}

/**
 * Tax on VDA income given each sale's gain (negative = loss, taken at nil).
 * `receiptIncome` only affects the surcharge slab.
 */
export function computeTax(
  saleGains: readonly Dec[],
  settings: Pick<Settings, "otherIncome" | "regime">,
  tdsCredit: Dec,
  receiptIncome: Dec = ZERO,
): TaxComputation {
  const taxableIncome = sum(saleGains.filter((g) => g.greaterThan(0)));
  const ignoredLosses = sum(saleGains.filter((g) => g.lessThan(0))).abs();
  const otherIncome = parseAmount(settings.otherIncome) ?? ZERO;
  const totalIncome = otherIncome.plus(receiptIncome).plus(taxableIncome);
  const surchargeRate = surchargeRateFor(totalIncome, settings.regime);
  const tax = taxableIncome.mul(VDA_TAX_RATE);
  const surcharge = tax.mul(surchargeRate);
  const cess = tax.plus(surcharge).mul(CESS_RATE);
  const totalTax = tax.plus(surcharge).plus(cess);
  const netPayable = totalTax.minus(tdsCredit);
  return {
    taxableIncome,
    ignoredLosses,
    otherIncome,
    receiptIncome,
    totalIncome,
    surchargeRate,
    tax,
    surcharge,
    cess,
    totalTax,
    tdsCredit,
    netPayable,
    isRefund: netPayable.lessThan(0),
  };
}

const saleGains = (disposals: readonly Disposal[]): Dec[] =>
  disposals.map((d) => d.gain);

function monthlySeries(
  disposals: readonly Disposal[],
  fy: number,
): MonthPoint[] {
  return fyMonthKeys(fy).map((month) => {
    const incomes = saleGains(
      disposals.filter((d) => istMonthKey(d.transfer.date) === month),
    );
    return {
      month,
      gains: sum(incomes.filter((g) => g.greaterThan(0))),
      losses: sum(incomes.filter((g) => g.lessThan(0))).abs(),
    };
  });
}

/** IST instant at 00:00 on `iso` */
const istStart = (iso: string): Date => istToInstant(`${iso}T00:00:00`);

/**
 * Quarter-wise accrual for the ITR: up to 15 June, 16 June to 15 September,
 * 16 September to 15 December, 16 December to 15 March, 16 March to 31 March.
 */
export function quarterlyAccrual(
  disposals: readonly Disposal[],
  fy: number,
): QuarterAccrual[] {
  const next = fy + 1;
  const bounds: { label: string; end: Date }[] = [
    { label: "Up to 15 June", end: istStart(`${fy}-06-16`) },
    { label: "16 June to 15 September", end: istStart(`${fy}-09-16`) },
    { label: "16 September to 15 December", end: istStart(`${fy}-12-16`) },
    { label: "16 December to 15 March", end: istStart(`${next}-03-16`) },
    { label: "16 March to 31 March", end: fyRange(fy).end },
  ];
  let start = fyRange(fy).start;
  return bounds.map(({ label, end }) => {
    const from = start;
    start = end;
    const incomes = saleGains(
      disposals.filter((d) => d.transfer.date >= from && d.transfer.date < end),
    );
    return { label, income: sum(incomes.filter((g) => g.greaterThan(0))) };
  });
}

export function outsideUsdcBefore(
  allDisposals: readonly Disposal[],
  acquisitions: readonly Acquisition[],
  ownBuys: readonly NormalizedOrder[],
  end: Date,
): OutsideUsdc | null {
  const before = allDisposals.filter((d) => d.transfer.date < end);
  const short = before.filter((d) =>
    d.shortfallQty.plus(d.feeShortfallQty).greaterThan(0),
  );
  if (short.length === 0) return null;
  const p2pBuys = ownBuys.filter((o) => o.date < end);
  const buyQty = sum(p2pBuys.map((o) => o.qty));
  return {
    missing: sum(short.map((d) => d.shortfallQty.plus(d.feeShortfallQty))),
    firstShortDate: istDateString(short[0].transfer.date),
    spent: sum(before.map((d) => d.transfer.qty.plus(d.transfer.feeQty))),
    known: sum(acquisitions.filter((a) => a.date < end).map((a) => a.qty)),
    boughtOnP2p: buyQty,
    avgBuyRate: buyQty.isZero()
      ? null
      : sum(p2pBuys.map((o) => o.inr)).div(buyQty),
  };
}

export function deliveredElsewhereBefore(
  orders: readonly NormalizedOrder[],
  wallets: ReadonlySet<string>,
  notMine: ReadonlySet<string>,
  end: Date,
): DeliveredElsewhere[] {
  const groups = new Map<string, NormalizedOrder[]>();
  for (const o of orders) {
    if (o.kind !== "BUY" || o.date >= end || deliveredToOwnWallet(o, wallets))
      continue;
    const key = o.recipient as string;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  return [...groups.entries()]
    .map(([address, list]) => ({
      address,
      orders: list,
      qty: sum(list.map((o) => o.qty)),
      inr: sum(list.map((o) => o.inr)),
      status: notMine.has(address)
        ? ("NOT_MINE" as const)
        : ("PENDING" as const),
    }))
    .sort((a, b) => b.qty.comparedTo(a.qty));
}

const toTdsItem = (o: NormalizedOrder): TdsItem => ({
  id: o.id,
  orderId: o.orderId,
  date: o.date,
  amount: o.inr,
  counterparty: o.counterparty,
});

export function computeFyReport(input: ReportInput): FyReport {
  const { orders, lots, tds, settings, fy } = input;
  const wallets = new Set(
    (input.wallets ?? orders.map((o) => o.wallet)).map((w) => w.toLowerCase()),
  );
  const notMine = new Set(
    (input.notMyWallets ?? []).map((w) => w.toLowerCase()),
  );

  const manual = manualLotsToAcquisitions(lots, input.otherGifts);
  const events = ordersToEvents(orders, wallets);
  const outside = outflowsToTransfers(input.outflows ?? [], wallets);
  const match = matchLots(
    [...events.acquisitions, ...manual.acquisitions],
    [...events.transfers, ...outside.transfers],
    settings.costMethod,
    input.specificLots,
  );

  const inFy = (d: Date): boolean => fyOf(d) === fy;
  const fyDisposals = match.disposals.filter((d) => inFy(d.transfer.date));
  // A gift is not a sale: no income, and its "loss" is not an ignored loss
  const disposals = fyDisposals.filter((d) => d.transfer.kind !== "GIFT_OUT");
  const fyOrders = orders.filter((o) => inFy(o.date));
  const allBuys = fyOrders.filter((o) => o.kind === "BUY");
  const buys = allBuys.filter((o) => deliveredToOwnWallet(o, wallets));
  const sells = fyOrders.filter((o) => o.kind !== "BUY");

  const receiptIncome = manual.receiptIncome.filter((r) => inFy(r.date));
  const receiptTotal = sum(receiptIncome.map((r) => r.amount));
  const tdsCredit = tdsCreditForFy(tds, fy);
  const tax = computeTax(
    saleGains(disposals),
    settings,
    tdsCredit,
    receiptTotal,
  );

  const fyEnd = fyRange(fy).end;
  const ownBuysAll = orders.filter(
    (o) => o.kind === "BUY" && deliveredToOwnWallet(o, wallets),
  );
  const outsideUsdc = outsideUsdcBefore(
    match.disposals,
    [...events.acquisitions, ...manual.acquisitions],
    ownBuysAll,
    fyEnd,
  );

  // Advance tax: net tax on gains accrued up to each instalment date
  const accruedTax = (until: Date): Dec =>
    computeTax(
      saleGains(disposals.filter((d) => d.transfer.date < until)),
      settings,
      tdsCreditUntil(tds, fy, until),
      receiptTotal,
    ).netPayable;

  return {
    fy,
    law: lawForFy(fy),
    buys,
    allBuys,
    sells,
    disposals,
    outsideSales: disposals.filter((d) => d.transfer.kind === "TRANSFER_OUT"),
    giftsOut: fyDisposals.filter((d) => d.transfer.kind === "GIFT_OUT"),
    outflowIssues: outside.issues,
    usdcBought: sum(buys.map((o) => o.qty)),
    usdcSold: sum(sells.map((o) => o.qty)),
    inrSpent: sum(buys.map((o) => o.inr)),
    inrReceived: sum(sells.map((o) => o.inr)),
    feesInr: sum(sells.map((o) => o.feeInr)),
    feesUsdc: sum(sells.map((o) => o.feeUsdc)),
    buyFeesInr: sum(buys.map((o) => o.feeInr)),
    feeLotCost: sum(disposals.map((d) => d.feeCost)),
    tax,
    monthly: monthlySeries(disposals, fy),
    quarters: quarterlyAccrual(disposals, fy),
    oversold: disposals.filter((d) => d.shortfallQty.greaterThan(0)),
    outsideUsdc,
    deliveredElsewhere: deliveredElsewhereBefore(
      orders,
      wallets,
      notMine,
      fyEnd,
    ),
    receiptIncome,
    unknownCostLots: lots.filter(
      (l) => l.costUnknown || l.source === "UNKNOWN",
    ),
    manualLotIssues: manual.issues,
    nonInrOrders: (input.excluded ?? []).filter(
      (e) => e.reason === "NON_INR" && inFy(e.date),
    ),
    sellerTds: sellerTdsCheck(
      sells.map(toTdsItem),
      settings.counterpartySpecifiedPerson,
      tdsCredit,
    ),
    // The user paid for every purchase, wherever it was delivered
    buyerTds: buyerAdvisory(
      allBuys.map(toTdsItem),
      settings.userSpecifiedPerson,
    ),
    advanceTax: advanceTaxPlan({
      fy,
      netPayable: tax.netPayable,
      accruedTax,
      // Accrual relief (proviso to s.234C / s.425) is for capital gains only
      accrual: settings.headOfIncome === "CAPITAL_GAINS",
      today: input.today,
    }),
  };
}

export const EFFECTIVE_RATE_NO_SURCHARGE: Dec = VDA_TAX_RATE.mul(
  new D(1).plus(CESS_RATE),
);
