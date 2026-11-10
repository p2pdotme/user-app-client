import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/tax/components";
import type { FyReport } from "@/tax/core/tax/compute";
import { formatDateIst, formatNumber, formatUsdc } from "@/tax/lib/format";
import { fyLabel } from "@/tax/lib/fy";

interface ReportWarningsProps {
  report: FyReport;
  onOpenSettings: () => void;
  /** Unanswered on-chain outflows in the FY; null when not checked yet */
  onchainPending?: number | null;
  onOpenOnchain?: () => void;
}

// Keep the reference warning palette but with readable body text
const READABLE_WARNING =
  "text-foreground *:data-[slot=alert-description]:text-foreground";

export function ReportWarnings({
  report,
  onOpenSettings,
  onchainPending = null,
  onOpenOnchain,
}: ReportWarningsProps) {
  const hasActivity = report.allBuys.length + report.sells.length > 0;
  const notMine = report.deliveredElsewhere.filter(
    (d) => d.status === "NOT_MINE",
  );
  const nonInrByCurrency: Record<string, number> = {};
  for (const o of report.nonInrOrders) {
    nonInrByCurrency[o.currency] = (nonInrByCurrency[o.currency] ?? 0) + 1;
  }
  return (
    <div className="flex w-full flex-col gap-3">
      {!hasActivity && (
        <Alert>
          <Info />
          <AlertDescription>
            No completed INR orders in {fyLabel(report.fy)}. Choose another
            financial year.
          </AlertDescription>
        </Alert>
      )}
      {onchainPending === null && hasActivity && onOpenOnchain && (
        <Alert data-testid="onchain-nudge">
          <Info />
          <AlertDescription>
            <p>
              This report sees only your P2P.me orders. USDC you sent to
              someone, or received from outside, may change your tax.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={onOpenOnchain}>
              Check on-chain transfers
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {onchainPending !== null && onchainPending > 0 && onOpenOnchain && (
        <Alert variant="warning" className={READABLE_WARNING}>
          <AlertTriangle />
          <AlertDescription>
            <p>
              {onchainPending} USDC transfer(s) out of your wallet up to the end
              of {fyLabel(report.fy)} are not answered yet. Until you answer,
              they are not in your tax and the cost of your later sales may be
              wrong.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={onOpenOnchain}>
              Answer them
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {report.outflowIssues.length > 0 && (
        <Alert variant="warning" className={READABLE_WARNING}>
          <AlertTriangle />
          <AlertDescription>
            {report.outflowIssues.length} transfer(s) out marked as sold have no
            confirmed INR value and were left out. Confirm the value in the
            On-chain check tab.
          </AlertDescription>
        </Alert>
      )}
      {report.unknownCostLots.length > 0 && (
        <Alert variant="warning" className={READABLE_WARNING}>
          <AlertTriangle />
          <AlertDescription>
            <p>
              Some of your USDC has no known source, so its cost is taken as ₹0.
              Your tax is higher because of this.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={onOpenSettings}>
              Tell us how it came in
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {notMine.length > 0 && (
        <Alert>
          <Info />
          <AlertDescription>
            <p className="inline-flex items-center gap-1">
              {notMine.reduce((n, d) => n + d.orders.length, 0)} purchase(s)
              were delivered to someone else's wallet and are not counted as
              your cost.
              <InfoTip rule="DELIVERED_ELSEWHERE" law={report.law} />
            </p>
            <p>
              Passing USDC on to someone else is itself a transfer, which may be
              taxable. Check it with your Chartered Accountant.
            </p>
          </AlertDescription>
        </Alert>
      )}
      {report.nonInrOrders.length > 0 && (
        <Alert variant="warning" className={READABLE_WARNING}>
          <AlertTriangle />
          <AlertDescription>
            <p className="inline-flex items-center gap-1">
              {report.nonInrOrders.length} completed order(s) in other
              currencies are not included (
              {Object.entries(nonInrByCurrency)
                .map(([c, n]) => `${c}: ${n}`)
                .join(", ")}
              ).
              <InfoTip rule="NON_INR" law={report.law} />
            </p>
            <details className="w-full">
              <summary className="cursor-pointer text-primary text-xs">
                Show these orders
              </summary>
              <ul className="mt-2 flex flex-col gap-1 text-xs">
                {report.nonInrOrders.map((o) => (
                  <li key={o.id} className="tabular-nums">
                    #{o.orderId} · {formatDateIst(o.date)} ·{" "}
                    {o.kind === "UNKNOWN" ? "Order" : o.kind} ·{" "}
                    {formatUsdc(o.qty)} USDC · {formatNumber(o.fiat, 2)}{" "}
                    {o.currency}
                  </li>
                ))}
              </ul>
            </details>
          </AlertDescription>
        </Alert>
      )}
      {report.manualLotIssues.length > 0 && (
        <Alert variant="warning" className={READABLE_WARNING}>
          <AlertTriangle />
          <AlertDescription>
            {report.manualLotIssues.length} manual lot(s) are invalid and were
            ignored. Fix them in Settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
