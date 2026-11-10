/**
 * Advance tax instalments: 1961 Act ss.208, 211 (interest ss.234B, 234C);
 * 2025 Act ss.403 to 408 (interest ss.424, 425).
 *
 * Tax on capital gains that arise after an instalment date does not have to be
 * paid in that instalment. It is paid with the next instalment, or by
 * 31 March if none is left (proviso to s.234C / s.425). So each instalment is
 * computed on the tax for gains accrued up to its due date, not on the
 * whole year's tax.
 *
 * That relief is for capital gains only. Under the business head the
 * instalments are 15/45/75/100% of the estimated tax for the whole year.
 */

import {
  ADVANCE_TAX_SCHEDULE,
  ADVANCE_TAX_THRESHOLD,
} from "@/tax/core/tax/rules";
import { D, type Dec, decMax, ZERO } from "@/tax/lib/decimal";
import { IST } from "@/tax/lib/fy";
import { istToInstant } from "@/tax/lib/ist";

export type InstalmentStatus = "PAST" | "UPCOMING";

export interface Instalment {
  /** YYYY-MM-DD (IST calendar date) */
  dueDate: string;
  /** Share of accrued tax due by this date */
  cumulativePct: Dec;
  /** Net tax on gains accrued up to this date (after TDS credit to date) */
  accruedTax: Dec;
  cumulativeAmount: Dec;
  amount: Dec;
  status: InstalmentStatus;
  /** true for the 31 March line covering gains after 15 March */
  yearEnd: boolean;
}

export interface AdvanceTaxPlan {
  required: boolean;
  /** Instalments follow the accrual of gains (capital gains head) */
  accrual: boolean;
  threshold: Dec;
  base: Dec;
  instalments: Instalment[];
}

/** Net tax on gains accrued before an instant (TDS credit to date deducted). */
export type AccruedTaxFn = (until: Date) => Dec;

const pad = (n: number): string => String(n).padStart(2, "0");

/** IST calendar date "YYYY-MM-DD" of `today`. */
function istToday(today: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(today);
}

/** Start of the IST day after `isoDate` (so the due date itself is included). */
function endOfIstDay(isoDate: string): Date {
  const start = istToInstant(`${isoDate}T00:00:00`);
  return new Date(start.getTime() + 86_400_000);
}

export interface AdvanceTaxInput {
  fy: number;
  /** Net tax for the whole year (after TDS credit) */
  netPayable: Dec;
  accruedTax: AccruedTaxFn;
  /** true (capital gains): instalments on gains accrued to each date */
  accrual?: boolean;
  today?: Date;
}

export function advanceTaxPlan({
  fy,
  netPayable,
  accruedTax,
  accrual = true,
  today = new Date(),
}: AdvanceTaxInput): AdvanceTaxPlan {
  const base = decMax(netPayable, ZERO);
  const required = base.greaterThanOrEqualTo(ADVANCE_TAX_THRESHOLD);
  const todayStr = istToday(today);

  const schedule = [
    ...ADVANCE_TAX_SCHEDULE.map((s) => ({
      dueDate: `${s.month >= 4 ? fy : fy + 1}-${pad(s.month)}-${pad(s.day)}`,
      pct: s.cumulative,
      yearEnd: false,
    })),
    { dueDate: `${fy + 1}-03-31`, pct: new D(1), yearEnd: true },
  ];

  let paidSoFar = ZERO;
  const instalments = schedule.map((s) => {
    const accrued =
      s.yearEnd || !accrual
        ? base
        : decMax(accruedTax(endOfIstDay(s.dueDate)), ZERO);
    const cumulativeAmount = decMax(accrued.mul(s.pct), paidSoFar);
    const amount = cumulativeAmount.minus(paidSoFar);
    paidSoFar = cumulativeAmount;
    const status: InstalmentStatus = s.dueDate < todayStr ? "PAST" : "UPCOMING";
    return {
      dueDate: s.dueDate,
      cumulativePct: s.pct,
      accruedTax: accrued,
      cumulativeAmount,
      amount,
      status,
      yearEnd: s.yearEnd,
    };
  });

  return {
    required,
    accrual,
    threshold: ADVANCE_TAX_THRESHOLD,
    base,
    // The 31 March line only matters when gains arose after 15 March
    instalments: instalments.filter(
      (i) => !i.yearEnd || i.amount.greaterThan(0),
    ),
  };
}
