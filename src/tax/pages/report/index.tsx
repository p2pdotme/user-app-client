import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { NonHomeHeader } from "@/components/non-home-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageMeta } from "@/hooks/use-page-meta";
import { INTERNAL_HREFS } from "@/lib/constants";
import { SectionHeader } from "@/tax/components";
import { useTaxSettings, type WalletSwitch } from "@/tax/contexts";
import type { Reconciliation } from "@/tax/core/onchain";
import { normalizeAddress } from "@/tax/core/subgraph/client";
import type { FyReport } from "@/tax/core/tax/compute";
import type { NormalizedOrder } from "@/tax/core/types";
import {
  type OnchainState,
  useOnchainTransfers,
  useOrders,
  useReconciliation,
  useTaxReport,
} from "@/tax/hooks";
import { fyLabel, fyOf } from "@/tax/lib/fy";
import { walletSetKey } from "@/tax/lib/manual-data";
import { AddressForm } from "./address-form";
import { AdvanceTax } from "./advance-tax";
import { DeliveredElsewhereStep } from "./delivered-elsewhere-step";
import { MissingCostStep } from "./missing-cost-step";
import { OnchainCheck } from "./onchain-check";
import { OrdersTable } from "./orders-table";
import { ReportFooter } from "./report-footer";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoCompletedOrdersState,
  NoOrdersState,
} from "./report-states";
import { ReportWarnings } from "./report-warnings";
import { ScheduleVda } from "./schedule-vda";
import { TaxBreakdown } from "./tax-breakdown";
import { TaxDetails, TaxSummary } from "./tax-summary";
import { TdsCheck } from "./tds-check";

const TABS = [
  { value: "summary", label: "Summary" },
  { value: "orders", label: "Orders" },
  { value: "schedule", label: "Schedule VDA" },
  { value: "advance", label: "Advance tax" },
  { value: "tds", label: "TDS" },
  { value: "onchain", label: "On-chain check" },
] as const;

export type TabValue = (typeof TABS)[number]["value"];

const isTabValue = (value: string): value is TabValue =>
  TABS.some((t) => t.value === value);

interface ReportTabsProps {
  report: FyReport;
  tab: TabValue;
  onTabChange: (tab: TabValue) => void;
  wallets: readonly string[];
  orders: readonly NormalizedOrder[];
  onchain: OnchainState;
  rec: Reconciliation | null;
  onAddWallet: (address: string) => void;
}

/** The report itself, below the summary. */
function ReportTabs({
  report,
  tab,
  onTabChange,
  wallets,
  orders,
  onchain,
  rec,
  onAddWallet,
}: ReportTabsProps) {
  const { data } = useTaxSettings();
  return (
    <div className="flex w-full flex-col gap-6">
      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as TabValue)}
        className="w-full gap-4">
        <TabsList className="no-print no-scrollbar w-full justify-start overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="flex-none px-3">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="summary" className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <SectionHeader title="Tax computation" />
            <TaxDetails report={report} />
          </div>
          <TaxBreakdown report={report} method={data.settings.costMethod} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTable report={report} />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleVda
            report={report}
            head={data.settings.headOfIncome}
            method={data.settings.costMethod}
          />
        </TabsContent>
        <TabsContent value="advance">
          <AdvanceTax report={report} />
        </TabsContent>
        <TabsContent value="tds">
          <TdsCheck report={report} />
        </TabsContent>
        <TabsContent value="onchain">
          <OnchainCheck
            wallets={wallets}
            orders={orders}
            fy={report.fy}
            law={report.law}
            state={onchain}
            rec={rec}
            onAddWallet={onAddWallet}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EMPTY: readonly string[] = [];

/** Tell the user when their entries were set aside or brought back. */
function announceSwitch(outcome: WalletSwitch): void {
  if (outcome === "SEPARATE") {
    toast.warning("Your entries were kept for the other wallet", {
      description:
        'USDC from outside P2P.me, TDS entries and wallets marked as not yours apply only to the wallets they were entered for. If both wallets are yours, add them together with "Add another wallet of yours".',
    });
  } else if (outcome === "RESTORED") {
    toast.info("Your earlier entries for this wallet are back", {
      description: "Change them any time in your tax profile.",
    });
  }
}

/** Required steps before any tax is shown */
const hasPendingDeliveries = (report: FyReport): boolean =>
  report.deliveredElsewhere.some((d) => d.status === "PENDING");
const needsAnswers = (report: FyReport): boolean =>
  hasPendingDeliveries(report) || report.outsideUsdc !== null;

/**
 * Whether the FY has anything to report: a completed order, or USDC sold,
 * given away or received as income outside P2P.me. With none of these every
 * figure is zero, so the summary and tabs are not shown.
 */
const hasActivity = (report: FyReport): boolean =>
  report.allBuys.length > 0 ||
  report.sells.length > 0 ||
  report.disposals.length > 0 ||
  report.giftsOut.length > 0 ||
  report.receiptIncome.length > 0;

/** Outflows in the FY that the user has not answered yet */
function pendingOutflows(
  rec: Reconciliation,
  fy: number,
  answered: ReadonlySet<string>,
): number {
  return rec.outflows.filter((m) => fyOf(m.time) === fy && !answered.has(m.id))
    .length;
}

/**
 * Wallets the report opens on: the ones this account last generated a report
 * for in this session (so coming back from another screen changes nothing),
 * otherwise the connected wallet.
 */
function initialWallets(
  defaultWallet: string | undefined,
  sessionWallets: readonly string[],
): readonly string[] | null {
  if (sessionWallets.length > 0) return sessionWallets;
  const connected = defaultWallet ? normalizeAddress(defaultWallet) : null;
  return connected ? [connected] : null;
}

interface ReportProps {
  /** The connected wallet. The report is generated for it straight away. */
  defaultWallet?: string;
}

export function Report({ defaultWallet }: ReportProps) {
  usePageMeta({ title: "Tax report" });
  const navigate = useNavigate();
  const { data, selectWallets, view, setView } = useTaxSettings();
  const openSettings = () => navigate(INTERNAL_HREFS.TAX_CONFIG);
  const answered = new Set(data.outflows.map((o) => o.id));
  const [wallets, setWallets] = useState<readonly string[] | null>(() =>
    initialWallets(defaultWallet, data.wallets),
  );
  // Year and tab live in the tax session, so they are still there after a
  // visit to the settings or legal sources page
  const fy = view.fy;
  const setFy = (next: number) => setView({ fy: next });
  const tab = isTabValue(view.tab) ? view.tab : "summary";
  const setTab = (next: TabValue) => setView({ tab: next });
  const orders = useOrders(wallets);
  const { report, orders: allOrders } = useTaxReport(
    orders.data,
    fy,
    wallets ?? EMPTY,
  );
  const onchain = useOnchainTransfers(wallets ?? EMPTY);
  const rec = useReconciliation(
    onchain.loaded?.transfers ?? null,
    allOrders,
    wallets ?? EMPTY,
  );

  // The wallets the report opened on become the active set for manual entries
  const openedOn = wallets ? walletSetKey(wallets) : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, for the wallets the report opened on
  useEffect(() => {
    if (openedOn) selectWallets(openedOn.split(","));
  }, []);

  const generate = (addresses: string[]) => {
    if (addresses.join(",") === wallets?.join(",")) void orders.refetch();
    announceSwitch(selectWallets(addresses));
    setWallets(addresses);
  };
  const addWallet = (address: string) => {
    if (wallets && !wallets.includes(address)) {
      const next = [...wallets, address];
      announceSwitch(selectWallets(next));
      setWallets(next);
    }
  };

  const ready =
    wallets !== null &&
    !orders.isFetching &&
    !orders.isError &&
    (orders.data?.length ?? 0) > 0 &&
    report !== null;

  const content = () => {
    if (wallets === null) return <EmptyState />;
    if (orders.isPending || orders.isFetching) {
      return <LoadingState loaded={orders.loaded} />;
    }
    if (orders.isError) {
      return (
        <ErrorState
          code={orders.error.code}
          onRetry={() => void orders.refetch()}
        />
      );
    }
    if (orders.data.length === 0) return <NoOrdersState />;
    if (!report) return null;
    // Required steps, in order: whose wallet received the purchases, then the
    // cost of USDC that came from outside P2P.me
    if (hasPendingDeliveries(report)) {
      return (
        <DeliveredElsewhereStep
          items={report.deliveredElsewhere}
          law={report.law}
          onAddWallet={addWallet}
        />
      );
    }
    if (report.outsideUsdc) {
      return <MissingCostStep need={report.outsideUsdc} law={report.law} />;
    }
    if (!hasActivity(report)) {
      return <NoCompletedOrdersState fy={fyLabel(report.fy)} />;
    }
    return (
      <ReportTabs
        report={report}
        tab={tab}
        onTabChange={setTab}
        wallets={wallets}
        orders={allOrders ?? []}
        onchain={onchain}
        rec={rec}
        onAddWallet={addWallet}
      />
    );
  };

  return (
    <>
      <NonHomeHeader
        title="Tax report"
        subtitle="India · Crypto (VDA) income tax"
        showHelp={false}
      />
      <main
        data-tax-print
        className="no-scrollbar flex h-full w-full flex-col overflow-y-auto">
        <div className="container-narrow flex flex-col gap-6 py-6">
          <AddressForm
            wallets={wallets ?? EMPTY}
            fy={fy}
            onFyChange={setFy}
            onGenerate={generate}
            loading={orders.isFetching}
          />
          {ready && report && !needsAnswers(report) && hasActivity(report) && (
            <>
              <TaxSummary report={report} />
              <ReportWarnings
                report={report}
                onOpenSettings={openSettings}
                onchainPending={
                  rec ? pendingOutflows(rec, report.fy, answered) : null
                }
                onOpenOnchain={() => setTab("onchain")}
              />
            </>
          )}
          <section className="flex min-w-0 flex-col gap-6">
            {wallets && report && (
              <p className="hidden text-sm print:block">
                {fyLabel(fy)} ·{" "}
                <span className="font-mono">{wallets.join(", ")}</span>
              </p>
            )}
            {content()}
          </section>
          <ReportFooter />
        </div>
      </main>
    </>
  );
}
