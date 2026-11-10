import { Download, Printer } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InfoTip, SectionHeader, TablePagination } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import {
  scheduleTotal,
  scheduleVdaCsv,
  scheduleVdaRows,
} from "@/tax/core/tax/schedule-vda";
import type { CostMethod, HeadOfIncome } from "@/tax/core/types";
import { usePagination } from "@/tax/hooks";
import { downloadText } from "@/tax/lib/download";
import { formatDateIst, formatInr, orderRef } from "@/tax/lib/format";
import { fyLabel } from "@/tax/lib/fy";
import { COST_METHOD_DISCLOSURE, costMethodOption } from "./cost-methods";
import { SpecificLots } from "./specific-lots";

const CSV_LABELS = {
  sl: "Sl.",
  orderId: "Order",
  acq: "Date of acquisition",
  transfer: "Date of transfer",
  head: "Head of income",
  acquiredAs: "Acquired as",
  cost: "Cost of acquisition (₹)",
  consideration: "Consideration received (₹)",
  income: "Income from transfer (₹)",
  loss: "Loss, ignored (₹, memo only)",
  headCg: "Capital Gain",
  headBusiness: "Business Income",
};

function QuarterTable({ report }: { report: FyReport }) {
  return (
    <Card className="w-full gap-0 py-2">
      <CardContent className="px-2">
        <Table aria-label="Quarter-wise accrual">
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">VDA income (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.quarters.map((q) => (
              <TableRow key={q.label}>
                <TableCell>{q.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatInr(q.income)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ScheduleVda({
  report,
  head,
  method,
}: {
  report: FyReport;
  head: HeadOfIncome;
  method: CostMethod;
}) {
  const rows = useMemo(
    () => scheduleVdaRows(report.disposals, head),
    [report, head],
  );
  const total = scheduleTotal(rows);
  const pagination = usePagination(rows, 20);
  const headLabel =
    head === "BUSINESS" ? CSV_LABELS.headBusiness : CSV_LABELS.headCg;

  const exportCsv = () =>
    downloadText(
      `schedule-vda-${fyLabel(report.fy).replace(/\s/g, "-")}.csv`,
      `﻿${scheduleVdaCsv(rows, CSV_LABELS)}`,
      "text/csv;charset=utf-8",
    );

  return (
    <div className="flex w-full flex-col gap-6">
      {method === "SPECIFIC" && <SpecificLots report={report} />}
      <div className="flex w-full flex-col gap-3">
        <SectionHeader
          title={`Schedule VDA for ${fyLabel(report.fy)}`}
          description={`One row per purchase lot used by each sale, so every row has one date of acquisition. Each sale's income is shared across its rows by quantity, and is nil on a loss. Copy these into Schedule VDA of your ITR (${head === "BUSINESS" ? "ITR-3" : "ITR-2"}).`}
          action={<InfoTip rule="SCHEDULE_VDA" law={report.law} />}
        />
        <p data-testid="vda-method" className="text-muted-foreground text-xs">
          Cost method: {costMethodOption(method).name}. {COST_METHOD_DISCLOSURE}
        </p>
        <div className="no-print flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={rows.length === 0}>
            <Download />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer />
            Print / PDF
          </Button>
        </div>
        <Card className="w-full py-2">
          <CardContent className="px-2">
            {rows.length === 0 ? (
              <p className="p-4 text-muted-foreground text-sm">
                No sales in this financial year.
              </p>
            ) : (
              <Table aria-label="Schedule VDA">
                <TableHeader>
                  <TableRow>
                    <TableHead>Sl.</TableHead>
                    <TableHead>Date of acquisition</TableHead>
                    <TableHead>Date of transfer</TableHead>
                    <TableHead>Head of income</TableHead>
                    <TableHead>Acquired as</TableHead>
                    <TableHead className="text-right">Cost (₹)</TableHead>
                    <TableHead className="text-right">
                      Consideration (₹)
                    </TableHead>
                    <TableHead className="text-right">Income (₹)</TableHead>
                    <TableHead className="text-right">
                      Loss, ignored (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* All rows render so Print / PDF includes every row;
                      rows outside the current page are hidden on screen only */}
                  {rows.map((r) => (
                    <TableRow
                      key={r.sl}
                      data-testid="vda-row"
                      className={cn(
                        (r.sl < pagination.from || r.sl > pagination.to) &&
                          "hidden print:table-row",
                      )}>
                      <TableCell>
                        {r.sl}
                        <span className="block text-muted-foreground text-xs">
                          {orderRef(r.orderId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.acquisitionDate
                          ? formatDateIst(r.acquisitionDate)
                          : "Not available"}
                      </TableCell>
                      <TableCell>{formatDateIst(r.transferDate)}</TableCell>
                      <TableCell>{headLabel}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.acquiredAs}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(r.cost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(r.consideration)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(r.income)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {r.loss.greaterThan(0) ? formatInr(r.loss) : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={7}>
                      <span className="inline-flex items-center gap-1">
                        Total income, all rows (carry to Schedule SI at 30%)
                        <InfoTip rule="LOSS_IGNORED" law={report.law} />
                      </span>
                    </TableCell>
                    <TableCell
                      data-testid="schedule-si"
                      className="text-right font-semibold tabular-nums">
                      {formatInr(total)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            )}
            {rows.length > 0 && (
              <TablePagination pagination={pagination} noun="rows" />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex w-full flex-col gap-3">
        <SectionHeader
          title="Quarter-wise income for the ITR"
          description="The ITR asks when your VDA income arose, for interest on advance tax. Use these totals."
          action={<InfoTip rule="ADVANCE_TAX" law={report.law} />}
        />
        <QuarterTable report={report} />
      </div>
      <p className="text-muted-foreground text-xs">
        If P2P.me is a reporting entity, it may report your transactions to the
        tax department (s.285BAA of the 1961 Act, s.509 of the 2025 Act).
      </p>
    </div>
  );
}
