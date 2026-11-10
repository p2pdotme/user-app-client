import ASSETS from "@/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { InfoTip } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import type { RuleId } from "@/tax/core/tax/rules";
import { formatInr, formatPct, formatUsdc } from "@/tax/lib/format";
import { fyLabel } from "@/tax/lib/fy";

// Fixed text size to prevent CLS. Mirrors user-app-client's txn summary
const STAT_TEXT_SIZE = "text-sm min-[400px]:text-base sm:text-lg";

interface Stat {
  label: string;
  value: string;
  rule: RuleId;
}

function HeroStat({ stat, law }: { stat: Stat; law: FyReport["law"] }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2">
      <p
        className={cn(
          "w-full break-words bg-linear-to-b from-primary to-primary/40 bg-clip-text text-center font-bold text-transparent tabular-nums",
          STAT_TEXT_SIZE,
        )}>
        {stat.value}
      </p>
      <p className="flex items-center gap-0.5 whitespace-nowrap text-center text-muted-foreground text-xs">
        {stat.label}
        <InfoTip rule={stat.rule} law={law} />
      </p>
    </div>
  );
}

/** Headline card: net payable / refund + taxable gains, ignored losses, total tax. */
export function TaxSummary({ report }: { report: FyReport }) {
  const x = report.tax;
  const law = report.law;
  const headline = x.isRefund ? "Refund expected" : "Net payable";
  const stats: Stat[] = [
    {
      label: "Taxable gains",
      value: formatInr(x.taxableIncome),
      rule: "COST_ONLY",
    },
    {
      label: "Ignored losses",
      value: formatInr(x.ignoredLosses),
      rule: "LOSS_IGNORED",
    },
    { label: "Total tax", value: formatInr(x.totalTax), rule: "TOTAL_TAX" },
  ];

  return (
    <Card className="w-full gap-1 rounded-xl border-none bg-primary/10 p-0 shadow-none">
      <CardHeader className="gap-1 rounded-xl bg-primary/15 p-4 px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-1">
              <span data-testid="headline-label">{headline}</span>
              <InfoTip rule="NET_PAYABLE" law={law} />
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {fyLabel(report.fy)} ·{" "}
              {law === "ITA_2025"
                ? "Income-tax Act, 2025"
                : "Income-tax Act, 1961"}
            </p>
          </div>
          <InfoTip rule="FINANCIAL_YEAR" law={law} />
        </div>
        <p
          data-testid="headline-value"
          className={cn(
            "font-bold text-3xl tabular-nums",
            x.isRefund ? "text-success" : "text-primary",
          )}>
          {formatInr(x.isRefund ? x.netPayable.abs() : x.netPayable)}
        </p>
      </CardHeader>
      <CardContent className="flex w-full items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-4">
        {stats.map((s, i) => (
          <div key={s.label} className="flex min-w-0 flex-1 items-center">
            {i > 0 && (
              <Separator orientation="vertical" className="h-12 sm:h-16" />
            )}
            <HeroStat stat={s} law={law} />
          </div>
        ))}
      </CardContent>
      {x.receiptIncome.greaterThan(0) && (
        <p
          data-testid="receipt-income-note"
          className="flex items-start gap-1 px-6 pb-4 text-xs leading-relaxed">
          <span>
            Plus {formatInr(x.receiptIncome)} of income on receiving USDC
            (salary, rewards or gifts). It is taxed at your slab rate, not
            included above: add it to your other income in your return.
          </span>
          <InfoTip rule="RECEIPT_INCOME" law={law} />
        </p>
      )}
    </Card>
  );
}

interface Row {
  label: string;
  value: string;
  rule: RuleId;
  extra?: string;
  muted?: boolean;
  strong?: boolean;
  /** Show the USDC token icon next to the value */
  usdc?: boolean;
  /** Short caveat shown under the value */
  note?: string;
}

function DetailRow({ row, law }: { row: Row; law: FyReport["law"] }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="flex items-center gap-1 text-sm">
        {row.label}
        <InfoTip rule={row.rule} law={law} extra={row.extra} />
      </dt>
      <dd
        className={cn(
          "flex flex-col items-end text-right text-sm tabular-nums",
          row.muted && "text-muted-foreground",
          row.strong && "font-semibold text-base text-primary",
        )}>
        <span className="inline-flex items-center gap-1.5">
          {row.usdc && (
            <ASSETS.ICONS.Usdc className="size-4" aria-hidden="true" />
          )}
          {row.value}
        </span>
        {row.note && (
          <span className="font-normal text-muted-foreground text-xs">
            {row.note}
          </span>
        )}
      </dd>
    </div>
  );
}

/** Settings-list style breakdown of every number, each with its rule. */
export function TaxDetails({ report }: { report: FyReport }) {
  const x = report.tax;
  const rows: Row[] = [
    {
      label: "USDC bought",
      value: `${formatUsdc(report.usdcBought)} USDC`,
      rule: "BUY_NOT_TAXABLE",
      usdc: true,
    },
    {
      label: "₹ spent",
      value: formatInr(report.inrSpent),
      rule: "BUY_NOT_TAXABLE",
    },
    {
      label: "USDC sold / spent",
      value: `${formatUsdc(report.usdcSold)} USDC`,
      rule: "SALE_TAXABLE",
      usdc: true,
    },
    {
      label: "₹ received",
      value: formatInr(report.inrReceived),
      rule: "SALE_TAXABLE",
    },
    {
      label: "Taxable gains",
      value: formatInr(x.taxableIncome),
      rule: "COST_ONLY",
    },
    {
      label: "Ignored losses",
      value: formatInr(x.ignoredLosses),
      rule: "LOSS_IGNORED",
      muted: true,
    },
    {
      label: "Fees on sales, not deductible",
      value: formatInr(report.feesInr),
      rule: "FEES_NOT_DEDUCTIBLE",
      extra: `${formatUsdc(report.feesUsdc)} USDC. INR fees on purchases (${formatInr(report.buyFeesInr)}) are not part of cost and are not deducted either.`,
      muted: true,
    },
    ...(x.receiptIncome.greaterThan(0)
      ? [
          {
            label: "Income on receiving USDC",
            value: formatInr(x.receiptIncome),
            rule: "RECEIPT_INCOME" as const,
            note: "Not taxed here: add it to your other income in your return",
          },
        ]
      : []),
    { label: "Tax (30%)", value: formatInr(x.tax), rule: "RATE_30" },
    {
      label: "Surcharge",
      value: `${formatInr(x.surcharge)} (${formatPct(x.surchargeRate)})`,
      rule: "SURCHARGE",
      note: x.surchargeRate.isZero()
        ? undefined
        : "Marginal relief not computed",
    },
    { label: "Cess (4%)", value: formatInr(x.cess), rule: "CESS" },
    { label: "Total tax", value: formatInr(x.totalTax), rule: "TOTAL_TAX" },
    { label: "TDS credit", value: formatInr(x.tdsCredit), rule: "TDS_CREDIT" },
    x.isRefund
      ? {
          label: "Refund expected",
          value: formatInr(x.netPayable.abs()),
          rule: "NET_PAYABLE",
          strong: true,
        }
      : {
          label: "Net payable",
          value: formatInr(x.netPayable),
          rule: "NET_PAYABLE",
          strong: true,
        },
  ];

  return (
    <Card className="w-full gap-0 py-2">
      <CardContent className="px-4">
        <dl className="flex flex-col">
          {rows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <Separator />}
              <DetailRow row={row} law={report.law} />
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
