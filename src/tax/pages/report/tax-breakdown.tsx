import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import type { CostMethod } from "@/tax/core/types";
import { sum } from "@/tax/lib/decimal";
import { formatInr, formatPct, formatUsdc } from "@/tax/lib/format";
import { fyLabel } from "@/tax/lib/fy";
import { costMethodOption } from "./cost-methods";

/** Plain-language, step-by-step explanation using the user's own numbers. */
export function TaxBreakdown({
  report,
  method,
}: {
  report: FyReport;
  method: CostMethod;
}) {
  const x = report.tax;
  const fy = fyLabel(report.fy);
  const methodText = costMethodOption(method).phrase;
  const cost = formatInr(sum(report.disposals.map((d) => d.cost)));

  const steps = [
    `You bought ${formatUsdc(report.usdcBought)} USDC for ${formatInr(report.inrSpent)} in ${fy}. Buying is not taxed, so this becomes your cost. The INR platform fee on top (${formatInr(report.buyFeesInr)}) is not part of cost.`,
    `You sold or spent ${formatUsdc(report.usdcSold)} USDC for ${formatInr(report.inrReceived)} on P2P.me in ${fy} across ${report.sells.length} sale(s).`,
    ...(report.outsideSales.length > 0
      ? [
          `You also sold or spent ${formatUsdc(sum(report.outsideSales.map((d) => d.transfer.qty)))} USDC outside P2P.me for ${formatInr(sum(report.outsideSales.map((d) => d.transfer.consideration)))} (${report.outsideSales.length} transfer(s) from the on-chain check). These are taxed the same way.`,
        ]
      : []),
    ...(report.giftsOut.length > 0
      ? [
          `You gave away ${formatUsdc(sum(report.giftsOut.map((d) => d.transfer.qty)))} USDC. It leaves your holdings but brings you no income, so it is not taxed here.`,
        ]
      : []),
    `For each sale we matched the USDC to your purchases using ${methodText}, including purchases from earlier years. Cost matched: ${cost}.`,
    `For each sale, income is what you received less the cost of all the USDC sold in it. Sale by sale, your profits add up to ${formatInr(x.taxableIncome)}. This is your taxable income from VDA.`,
    `Sales at a loss add up to ${formatInr(x.ignoredLosses)}. By law each loss is taken at nil and does not reduce your tax. In Schedule VDA each sale is split by the purchase lots it used, and its income is shared across those rows by quantity.`,
    `Tax at 30% on ${formatInr(x.taxableIncome)} = ${formatInr(x.tax)}.`,
    x.surchargeRate.isZero()
      ? `Your total income is ${formatInr(x.totalIncome)}, which is not above ₹50 lakh, so no surcharge applies.`
      : `Your total income is ${formatInr(x.totalIncome)}, so a surcharge of ${formatPct(x.surchargeRate)} applies: ${formatInr(x.surcharge)}.`,
    `Health & Education Cess at 4% of (tax + surcharge) = ${formatInr(x.cess)}. Total tax = ${formatInr(x.totalTax)}.`,
    x.isRefund
      ? `Your TDS credit of ${formatInr(x.tdsCredit)} is more than the tax, so you can expect a refund of ${formatInr(x.netPayable.abs())}.`
      : `Less TDS credit of ${formatInr(x.tdsCredit)}, you need to pay ${formatInr(x.netPayable)}.`,
    `The USDC fee and tips on your sales (${formatInr(report.feesInr)}) are not deductible and were not used to reduce your gains.`,
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="How your tax was calculated" />
      <Card className="w-full py-4">
        <CardContent className="px-4">
          <ol className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
