/**
 * Schedule VDA rows (ITR-2 / ITR-3).
 *
 * One row per purchase lot used by a sale, so each row carries a single date
 * of acquisition, its own cost and a pro-rata share of the consideration.
 * Income is worked out per sale (nil on a loss) and shared across that sale's
 * rows by quantity, so the rows add up to the sale's income. The loss of a
 * loss-making sale is kept in a separate memorandum column.
 *
 * Fields: date of acquisition, date of transfer, head of income, cost of
 * acquisition, consideration received, income from transfer.
 */
import Papa from "papaparse";
import type { Disposal, LotSource } from "@/tax/core/tax/lots";
import type { HeadOfIncome } from "@/tax/core/types";
import { type Dec, sum } from "@/tax/lib/decimal";
import { formatDateIst } from "@/tax/lib/format";

export interface ScheduleVdaRow {
  sl: number;
  orderId: string;
  /** null when no purchase covers this part (cost taken as ₹0) */
  acquisitionDate: Date | null;
  transferDate: Date;
  head: HeadOfIncome;
  /** How the USDC in this row was acquired */
  acquiredAs: string;
  cost: Dec;
  consideration: Dec;
  /** Income as filed: never below nil */
  income: Dec;
  /** Loss on this row (memorandum only; ignored by law), positive number */
  loss: Dec;
}

export const ACQUIRED_AS: Record<LotSource, string> = {
  P2P: "Bought on P2P.me",
  EXCHANGE: "Bought on an exchange",
  OWN_WALLET: "From own wallet",
  SALARY: "Salary or business receipt",
  REWARD: "Reward or airdrop",
  GIFT_RELATIVE: "Gift from a relative",
  GIFT_NON_RELATIVE: "Gift from a non-relative",
  UNKNOWN: "Source not known",
};

export function scheduleVdaRows(
  disposals: readonly Disposal[],
  head: HeadOfIncome,
): ScheduleVdaRow[] {
  return disposals
    .flatMap((d) =>
      d.rows.map((r) => ({
        orderId: d.transfer.orderId,
        acquisitionDate: r.acquiredAt,
        transferDate: d.transfer.date,
        head,
        acquiredAs: r.source ? ACQUIRED_AS[r.source] : ACQUIRED_AS.UNKNOWN,
        cost: r.cost,
        consideration: r.consideration,
        income: r.income,
        loss: r.loss,
      })),
    )
    .map((row, i) => ({ sl: i + 1, ...row }));
}

/** Total income from transfer of VDA: the figure carried to Schedule SI. */
export function scheduleTotal(rows: readonly ScheduleVdaRow[]): Dec {
  return sum(rows.map((r) => r.income));
}

export interface CsvLabels {
  sl: string;
  orderId: string;
  acq: string;
  transfer: string;
  head: string;
  acquiredAs: string;
  cost: string;
  consideration: string;
  income: string;
  loss: string;
  headCg: string;
  headBusiness: string;
}

/** CSV with plain numbers (2 dp, no grouping) and DD/MM/YYYY dates. */
export function scheduleVdaCsv(
  rows: readonly ScheduleVdaRow[],
  labels: CsvLabels,
): string {
  return Papa.unparse({
    fields: [
      labels.sl,
      labels.orderId,
      labels.acq,
      labels.transfer,
      labels.head,
      labels.acquiredAs,
      labels.cost,
      labels.consideration,
      labels.income,
      labels.loss,
    ],
    data: rows.map((r) => [
      r.sl,
      r.orderId,
      r.acquisitionDate ? formatDateIst(r.acquisitionDate) : "",
      formatDateIst(r.transferDate),
      r.head === "BUSINESS" ? labels.headBusiness : labels.headCg,
      r.acquiredAs,
      r.cost.toFixed(2),
      r.consideration.toFixed(2),
      r.income.toFixed(2),
      r.loss.toFixed(2),
    ]),
  });
}
