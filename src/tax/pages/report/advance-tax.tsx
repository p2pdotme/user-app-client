import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoTip, SectionHeader } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import { formatInr, formatIsoDate, formatPct } from "@/tax/lib/format";

/** Four instalments (plus 31 March for late gains) in a plain table. */
export function AdvanceTax({ report }: { report: FyReport }) {
  const plan = report.advanceTax;
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader
        title="Advance tax"
        action={<InfoTip rule="ADVANCE_TAX" law={report.law} />}
      />
      {!plan.required ? (
        <Card className="w-full flex-row items-center gap-3 px-4 py-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          <p className="text-sm">
            Net payable is below ₹10,000, so advance tax is not required.
          </p>
        </Card>
      ) : (
        <>
          <p data-testid="advance-tax-basis" className="text-sm">
            Net payable is {formatInr(plan.base)}, which is ₹10,000 or more.{" "}
            {plan.accrual
              ? "Each instalment below is worked out on the tax for gains you had made by that date, so gains made later are paid later without interest."
              : "Under business income each instalment is a share of the estimated tax for the whole year, whenever the gains arose. The relief for gains made later applies to capital gains only."}
          </p>
          <Card className="w-full gap-0 py-2">
            <CardContent className="px-2">
              <Table aria-label="Advance tax instalments">
                <TableHeader>
                  <TableRow>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">
                      {plan.accrual
                        ? "Tax on gains so far"
                        : "Tax for the year"}
                    </TableHead>
                    <TableHead className="text-right">Cumulative %</TableHead>
                    <TableHead className="text-right">
                      Cumulative amount
                    </TableHead>
                    <TableHead className="text-right">Pay this time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.instalments.map((i) => (
                    <TableRow key={i.dueDate}>
                      <TableCell className="font-medium">
                        {formatIsoDate(i.dueDate)}
                        {i.yearEnd && (
                          <span className="block font-normal text-muted-foreground text-xs">
                            Gains after 15 March
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(i.accruedTax)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPct(i.cumulativePct)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(i.cumulativeAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatInr(i.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            i.status === "PAST"
                              ? "text-muted-foreground"
                              : "border-primary/40 text-primary"
                          }>
                          {i.status === "PAST" ? "Date passed" : "Upcoming"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      <p className="text-muted-foreground text-xs">
        A shortfall attracts interest under s.234B and s.234C of the 1961 Act,
        or s.424 and s.425 of the 2025 Act.
      </p>
    </div>
  );
}
