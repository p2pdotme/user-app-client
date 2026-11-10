import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoTip, SectionHeader, TablePagination } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import { SPECIFIED_PERSON_TEST } from "@/tax/core/tax/rules";
import {
  type CounterpartyTds,
  type TdsSummary,
  UNKNOWN_COUNTERPARTY,
} from "@/tax/core/tax/tds";
import { usePagination } from "@/tax/hooks";
import { formatInr, formatIsoDate, formatMonthKey } from "@/tax/lib/format";
import { shortAddress } from "./delivered-elsewhere-step";

const partyLabel = (c: string): string =>
  c === UNKNOWN_COUNTERPARTY ? "Not known (grouped)" : shortAddress(c);

function CounterpartyTable({
  summary,
  label,
  partyHeading,
}: {
  summary: TdsSummary;
  label: string;
  partyHeading: string;
}) {
  const pagination = usePagination<CounterpartyTds>(summary.byCounterparty, 20);
  return (
    <Card className="w-full gap-0 py-2">
      <CardContent className="px-2">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              <TableHead>{partyHeading}</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Paid in the year (₹)</TableHead>
              <TableHead>Limit crossed?</TableHead>
              <TableHead className="text-right">TDS 1% (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.map((c) => (
              <TableRow key={c.counterparty}>
                <TableCell className="font-mono text-sm">
                  {partyLabel(c.counterparty)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.orders}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatInr(c.amount)}
                </TableCell>
                <TableCell>{c.crossed ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatInr(c.tds)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatInr(summary.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <TablePagination
          pagination={pagination}
          noun={`${partyHeading.toLowerCase()}s`}
        />
      </CardContent>
    </Card>
  );
}

function SellerTds({ report }: { report: FyReport }) {
  const s = report.sellerTds;
  const totals = [
    {
      label: s.hasUnknownCounterparty
        ? "TDS buyers should have deducted (ceiling)"
        : "TDS buyers should have deducted (estimate)",
      value: s.expected,
    },
    { label: "TDS you entered (Form 26AS / AIS)", value: s.entered },
    { label: "Difference", value: s.difference },
  ];
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader
        title="TDS on your sales"
        description={`Each buyer is checked separately against ${formatInr(s.threshold)} for the year. Once a buyer's total crosses it, TDS is due on everything that buyer paid you. P2P.me buyers usually do not deduct it; if they don't, they are in default, not you.`}
        action={<InfoTip rule="TDS_SELLER" law={report.law} />}
      />
      <Card className="w-full gap-0 py-2">
        <CardContent className="px-4">
          <dl>
            {totals.map((r, i) => (
              <div key={r.label}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-sm">{r.label}</dt>
                  <dd className="font-medium text-sm tabular-nums">
                    {formatInr(r.value)}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      {s.hasUnknownCounterparty && (
        <p className="text-muted-foreground text-xs">
          Some orders do not show who the buyer was, so they are grouped
          together. That makes this figure a ceiling, not an estimate.
        </p>
      )}
      {s.byCounterparty.length > 0 && (
        <CounterpartyTable
          summary={s}
          label="TDS on your sales by buyer"
          partyHeading="Buyer"
        />
      )}
    </div>
  );
}

function BuyerTds({ report }: { report: FyReport }) {
  const b = report.buyerTds;
  const months = usePagination(b.months, 12);
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader
        title="TDS on your purchases"
        description={`You are the payer when you buy. Each seller is checked separately against ${formatInr(b.threshold)} for the year.`}
        action={<InfoTip rule="TDS_BUYER" law={report.law} />}
      />
      <Alert>
        <Info />
        <AlertDescription>
          Advisory, not a calculated liability. If you had to deduct and did
          not, interest applies (s.201(1A) of the 1961 Act, s.398(3) of the 2025
          Act) and a penalty may follow (s.271C, s.448). {SPECIFIED_PERSON_TEST}{" "}
          If you are not one, you need a TAN and use Form 26Q (Form 140 from
          April 2026) instead.
        </AlertDescription>
      </Alert>
      {b.byCounterparty.length > 0 && (
        <CounterpartyTable
          summary={b}
          label="TDS on your purchases by seller"
          partyHeading="Seller"
        />
      )}
      {b.months.some((m) => m.tds.greaterThan(0)) && (
        <Card className="w-full gap-0 py-2">
          <CardContent className="px-2">
            <Table aria-label="TDS on your purchases">
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">TDS 1% (₹)</TableHead>
                  <TableHead>Deposit with</TableHead>
                  <TableHead>Due by</TableHead>
                  <TableHead>Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.items.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>
                      {formatMonthKey(m.month)}
                      <span className="block text-muted-foreground text-xs">
                        {m.count} orders
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInr(m.tds)}
                    </TableCell>
                    <TableCell>
                      {m.tds.greaterThan(0) ? m.forms.statement : "Not due"}
                    </TableCell>
                    <TableCell>
                      {m.tds.greaterThan(0)
                        ? formatIsoDate(m.dueDate)
                        : "Not due"}
                    </TableCell>
                    <TableCell>
                      {m.tds.greaterThan(0) ? m.forms.certificate : "Not due"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatInr(b.total)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
            <TablePagination pagination={months} noun="months" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function TdsCheck({ report }: { report: FyReport }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <SellerTds report={report} />
      <BuyerTds report={report} />
    </div>
  );
}
