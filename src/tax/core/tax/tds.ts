/**
 * TDS on transfer of VDA: 1961 Act s.194S | 2025 Act s.393(1), Table Sl. No. 8(vi).
 *
 * The no-deduction limit (s.194S(3) / s.393(4)) applies to the consideration
 * paid by ONE payer to ONE payee in the financial year. Once that pair's total
 * exceeds the limit, the exemption is lost for the year: tax is deductible on
 * the whole consideration, including sums paid earlier (deducted when the
 * limit is crossed), and on every later payment (CBDT Circular 13/2022, Q6).
 *
 * 1. Seller side: TDS the buyers of the user's USDC should have deducted.
 *    The payer is the counterparty; its status is unknown, so the ₹10,000
 *    limit applies by default (liquidity providers are generally in business).
 * 2. Buyer side (advisory): on the user's own purchases the user is the payer.
 *    Not a calculated liability.
 *
 * Where the counterparty is not known, all such orders are grouped together,
 * which makes the figure a ceiling rather than an estimate.
 */

import {
  TDS_DEPOSIT_DAYS_AFTER_MONTH_END,
  TDS_RATE,
  TDS_THRESHOLD_OTHER,
  TDS_THRESHOLD_SPECIFIED,
} from "@/tax/core/tax/rules";
import type { TdsEntry } from "@/tax/core/types";
import { type Dec, parseAmount, sum, ZERO } from "@/tax/lib/decimal";
import { fyOf, istDateToInstant, istMonthKey } from "@/tax/lib/fy";

/** Key used when the counterparty is not known */
export const UNKNOWN_COUNTERPARTY = "unknown";

/** Deductions from this month (IST) use the Income-tax Act, 2025 forms. */
const FIRST_2025_ACT_MONTH = "2026-04";

export interface TdsItem {
  id: string;
  orderId: string;
  date: Date;
  amount: Dec;
  /** Payer and payee pair key: the counterparty address, or null if unknown */
  counterparty: string | null;
}

export interface TdsLine extends TdsItem {
  /** This pair's cumulative FY amount including this item */
  cumulative: Dec;
  /** TDS deductible on this payment (at crossing: on the whole cumulative) */
  tds: Dec;
}

export interface CounterpartyTds {
  counterparty: string;
  orders: number;
  amount: Dec;
  tds: Dec;
  crossed: boolean;
}

export interface TdsForms {
  /** Challan-cum-statement */
  statement: string;
  /** TDS certificate */
  certificate: string;
}

export interface MonthlyTds {
  /** YYYY-MM (IST) */
  month: string;
  count: number;
  amount: Dec;
  tds: Dec;
  /** Deposit due date, YYYY-MM-DD */
  dueDate: string;
  forms: TdsForms;
}

export interface TdsSummary {
  threshold: Dec;
  lines: TdsLine[];
  byCounterparty: CounterpartyTds[];
  months: MonthlyTds[];
  total: Dec;
  /** true when any order had no known counterparty (figure is a ceiling) */
  hasUnknownCounterparty: boolean;
}

export interface SellerTdsCheck extends TdsSummary {
  expected: Dec;
  entered: Dec;
  /** expected − entered (positive → less TDS was deducted than expected) */
  difference: Dec;
}

export type BuyerAdvisory = TdsSummary;

export function tdsThreshold(specifiedPerson: boolean): Dec {
  return specifiedPerson ? TDS_THRESHOLD_SPECIFIED : TDS_THRESHOLD_OTHER;
}

/** Forms for a deduction made in this IST month. */
export function tdsFormsFor(monthKey: string): TdsForms {
  return monthKey < FIRST_2025_ACT_MONTH
    ? { statement: "Form 26QE", certificate: "Form 16E" }
    : { statement: "Form 141 (Schedule D)", certificate: "Form 132" };
}

/**
 * Per payer and payee pair: nothing until the pair's cumulative amount exceeds
 * the limit; at that payment, 1% of the whole cumulative amount; after that,
 * 1% of each payment.
 */
export function applyThreshold(
  items: readonly TdsItem[],
  threshold: Dec,
): TdsLine[] {
  const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  const totals = new Map<string, { cumulative: Dec; crossed: boolean }>();
  return sorted.map((item) => {
    const key = item.counterparty ?? UNKNOWN_COUNTERPARTY;
    const prev = totals.get(key) ?? { cumulative: ZERO, crossed: false };
    const cumulative = prev.cumulative.plus(item.amount);
    let tds = ZERO;
    let crossed = prev.crossed;
    if (crossed) tds = item.amount.mul(TDS_RATE);
    else if (cumulative.greaterThan(threshold)) {
      tds = cumulative.mul(TDS_RATE);
      crossed = true;
    }
    totals.set(key, { cumulative, crossed });
    return { ...item, cumulative, tds };
  });
}

/** Deposit due date: 30 days from the end of the (IST) month of deduction. */
export function form26qeDueDate(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0));
  const due = new Date(
    lastDay.getTime() + TDS_DEPOSIT_DAYS_AFTER_MONTH_END * 86_400_000,
  );
  return due.toISOString().slice(0, 10);
}

export function monthlyTotals(lines: readonly TdsLine[]): MonthlyTds[] {
  const map = new Map<string, MonthlyTds>();
  for (const l of lines) {
    const month = istMonthKey(l.date);
    const prev = map.get(month) ?? {
      month,
      count: 0,
      amount: ZERO,
      tds: ZERO,
      dueDate: form26qeDueDate(month),
      forms: tdsFormsFor(month),
    };
    map.set(month, {
      ...prev,
      count: prev.count + 1,
      amount: prev.amount.plus(l.amount),
      tds: prev.tds.plus(l.tds),
    });
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function byCounterparty(lines: readonly TdsLine[]): CounterpartyTds[] {
  const map = new Map<string, CounterpartyTds>();
  for (const l of lines) {
    const key = l.counterparty ?? UNKNOWN_COUNTERPARTY;
    const prev = map.get(key) ?? {
      counterparty: key,
      orders: 0,
      amount: ZERO,
      tds: ZERO,
      crossed: false,
    };
    map.set(key, {
      ...prev,
      orders: prev.orders + 1,
      amount: prev.amount.plus(l.amount),
      tds: prev.tds.plus(l.tds),
      crossed: prev.crossed || l.tds.greaterThan(0),
    });
  }
  return [...map.values()].sort((a, b) => b.amount.comparedTo(a.amount));
}

function summarise(items: readonly TdsItem[], threshold: Dec): TdsSummary {
  const lines = applyThreshold(items, threshold);
  return {
    threshold,
    lines,
    byCounterparty: byCounterparty(lines),
    months: monthlyTotals(lines),
    total: sum(lines.map((l) => l.tds)),
    hasUnknownCounterparty: items.some((i) => i.counterparty === null),
  };
}

/** Sum of valid TDS entries dated within the FY. Invalid entries are ignored. */
export function tdsCreditForFy(entries: readonly TdsEntry[], fy: number): Dec {
  return sum(
    entries
      .map((e) => ({
        date: istDateToInstant(e.date),
        amount: parseAmount(e.amount),
      }))
      .filter(
        (e): e is { date: Date; amount: Dec } =>
          e.date !== null && e.amount !== null && fyOf(e.date) === fy,
      )
      .map((e) => e.amount),
  );
}

/** TDS entries (valid only) dated on or before `until` within the FY. */
export function tdsCreditUntil(
  entries: readonly TdsEntry[],
  fy: number,
  until: Date,
): Dec {
  return sum(
    entries
      .map((e) => ({
        date: istDateToInstant(e.date),
        amount: parseAmount(e.amount),
      }))
      .filter(
        (e): e is { date: Date; amount: Dec } =>
          e.date !== null &&
          e.amount !== null &&
          fyOf(e.date) === fy &&
          e.date < until,
      )
      .map((e) => e.amount),
  );
}

export function sellerTdsCheck(
  sales: readonly TdsItem[],
  counterpartySpecifiedPerson: boolean,
  entered: Dec,
): SellerTdsCheck {
  const summary = summarise(sales, tdsThreshold(counterpartySpecifiedPerson));
  return {
    ...summary,
    expected: summary.total,
    entered,
    difference: summary.total.minus(entered),
  };
}

export function buyerAdvisory(
  purchases: readonly TdsItem[],
  userSpecifiedPerson: boolean,
): BuyerAdvisory {
  return summarise(purchases, tdsThreshold(userSpecifiedPerson));
}
