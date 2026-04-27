import { Filter } from "lucide-react";
import moment from "moment";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FAQAccordion, NonHomeHeader, SectionHeader } from "@/components";
import { Button } from "@/components/ui/button";
import type { EnrichedSubgraphOrder } from "@/core/p2pdotme/shared/validation";
import { useTxnHistory } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { exportTransactionsToCSV } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
import {
  getDateRangeFromPreset,
  SANE_DEFAULT_FILTERS,
  type TransactionFilters,
  transformSubgraphOrderToTransaction,
} from "./shared";
import { TransactionFiltersDrawer } from "./transaction-filters-drawer";
import { TransactionCard } from "./txn-card";
import { TransactionCardSkeleton } from "./txn-card-skeleton";
import { TransactionsSummary } from "./txn-summary";
import { TransactionsSummarySkeleton } from "./txn-summary-skeleton";

// Render skeleton loaders
const renderSkeletons = (count: number) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <TransactionCardSkeleton key={i} />
    ))}
  </div>
);

export function Transactions() {
  const { t } = useTranslation();

  // Initialize filters with sane defaults (non-cancelled + this month)
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const saneDefaults = { ...SANE_DEFAULT_FILTERS };
    // Set initial date range based on preset
    saneDefaults.dateRange = getDateRangeFromPreset(
      saneDefaults.datePreset,
      saneDefaults,
    );
    return saneDefaults;
  });

  // Handler for filters change from drawer
  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const {
    data: txnHistoryData,
    isPending: isTxnHistoryPending,
    isError: isTxnHistoryError,
    error: txnHistoryError,
  } = useTxnHistory({
    dateRange: filters.dateRange,
  });

  // Transform subgraph data to Transaction interface
  const transactions = useMemo(() => {
    if (!txnHistoryData) return [];

    // Transform array to Transaction interface
    const transformed = (txnHistoryData as EnrichedSubgraphOrder[]).map(
      transformSubgraphOrderToTransaction,
    );
    return transformed;
  }, [txnHistoryData]);

  // Apply comprehensive filtering
  const filteredTransactions = useMemo(() => {
    // When loading, no transactions are available yet.
    if (isTxnHistoryPending) return [];

    let filtered = transactions;

    // Apply filter-based filtering
    // Type filter
    if (filters.types.length > 0 && filters.types.length < 3) {
      filtered = filtered.filter((tx) => filters.types.includes(tx.type));
    }

    // Status filter
    if (filters.statuses.length > 0 && filters.statuses.length < 5) {
      filtered = filtered.filter((tx) => filters.statuses.includes(tx.status));
    }

    // Currency filter
    if (filters.currencies.length > 0 && filters.currencies.length < 3) {
      filtered = filtered.filter((tx) =>
        filters.currencies.includes(tx.currency),
      );
    }

    // Dispute status filter
    if (
      filters.disputeStatuses.length > 0 &&
      filters.disputeStatuses.length < 4
    ) {
      filtered = filtered.filter((tx) => {
        const disputeStatus: "DEFAULT" | "RAISED" | "SETTLED" | "NONE" =
          tx.disputeStatus ? tx.disputeStatus : "NONE";
        return filters.disputeStatuses.includes(disputeStatus);
      });
    }

    // Date range filtering is now handled by the useTxnHistory hook
    // to improve performance and support larger date ranges

    return filtered;
  }, [transactions, isTxnHistoryPending, filters]);

  // Sort transactions by creation date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => b.createdAt - a.createdAt);
  }, [filteredTransactions]);

  // Handle download
  const handleDownload = () => {
    exportTransactionsToCSV(sortedTransactions, t);
  };

  // Helper to generate applied filter badges
  const getAppliedFilters = () => {
    const appliedFilters: {
      key: string;
      label: string;
      onClear: () => void;
    }[] = [];

    // Type filters (different from sane defaults)
    const isSameAsDefaultTypes =
      filters.types.length === SANE_DEFAULT_FILTERS.types.length &&
      filters.types.every((type) => SANE_DEFAULT_FILTERS.types.includes(type));

    if (!isSameAsDefaultTypes) {
      appliedFilters.push({
        key: "types",
        label: t("TYPE_FILTER", {
          types: filters.types.map((type: string) => t(type)).join(", "),
        }),
        onClear: () =>
          setFilters({ ...filters, types: SANE_DEFAULT_FILTERS.types }),
      });
    }

    // Status filters (different from sane defaults)
    const isSameAsDefaultStatuses =
      filters.statuses.length === SANE_DEFAULT_FILTERS.statuses.length &&
      filters.statuses.every((status) =>
        SANE_DEFAULT_FILTERS.statuses.includes(status),
      );

    if (!isSameAsDefaultStatuses) {
      appliedFilters.push({
        key: "statuses",
        label: t("STATUS_FILTER", {
          statuses: filters.statuses
            .map((status: string) => t(status))
            .join(", "),
        }),
        onClear: () =>
          setFilters({ ...filters, statuses: SANE_DEFAULT_FILTERS.statuses }),
      });
    }

    // Currency filters (different from sane defaults)
    const isSameAsDefaultCurrencies =
      filters.currencies.length === SANE_DEFAULT_FILTERS.currencies.length &&
      filters.currencies.every((currency) =>
        SANE_DEFAULT_FILTERS.currencies.includes(currency),
      );

    if (!isSameAsDefaultCurrencies) {
      appliedFilters.push({
        key: "currencies",
        label: t("CURRENCY_FILTER", {
          currencies: filters.currencies.join(", "),
        }),
        onClear: () =>
          setFilters({
            ...filters,
            currencies: SANE_DEFAULT_FILTERS.currencies,
          }),
      });
    }

    // Dispute status filters (different from sane defaults)
    const isSameAsDefaultDisputeStatuses =
      filters.disputeStatuses.length ===
        SANE_DEFAULT_FILTERS.disputeStatuses.length &&
      filters.disputeStatuses.every((status) =>
        SANE_DEFAULT_FILTERS.disputeStatuses.includes(status),
      );

    if (!isSameAsDefaultDisputeStatuses) {
      const disputeLabels = filters.disputeStatuses.map((status: string) =>
        status === "NONE" ? t("NO_DISPUTE") : t(status),
      );
      appliedFilters.push({
        key: "disputes",
        label: t("DISPUTE_FILTER", { disputes: disputeLabels.join(", ") }),
        onClear: () =>
          setFilters({
            ...filters,
            disputeStatuses: SANE_DEFAULT_FILTERS.disputeStatuses,
          }),
      });
    }

    // Date range filters (different from sane defaults)
    if (filters.datePreset !== SANE_DEFAULT_FILTERS.datePreset) {
      let dateLabel = "";
      if (
        filters.datePreset === "custom" &&
        filters.dateRange.from &&
        filters.dateRange.to
      ) {
        dateLabel = `${moment(filters.dateRange.from).format("DD MMM")} - ${moment(filters.dateRange.to).format("DD MMM YYYY")}`;
      } else {
        const presetLabels: Record<string, string> = {
          last7days: t("LAST_7_DAYS"),
          last30days: t("LAST_30_DAYS"),
          thisMonth: t("THIS_MONTH"),
          last3months: t("LAST_3_MONTHS"),
          custom: t("CUSTOM_RANGE"),
        };
        dateLabel = presetLabels[filters.datePreset];
      }

      appliedFilters.push({
        key: "date",
        label: t("DATE_FILTER", { range: dateLabel }),
        onClear: () =>
          setFilters({
            ...filters,
            datePreset: SANE_DEFAULT_FILTERS.datePreset,
            dateRange: getDateRangeFromPreset(
              SANE_DEFAULT_FILTERS.datePreset,
              SANE_DEFAULT_FILTERS,
            ),
          }),
      });
    }

    return appliedFilters;
  };

  const appliedFilters = getAppliedFilters();

  const renderContent = () => {
    if (isTxnHistoryPending) {
      return renderSkeletons(4);
    }

    if (isTxnHistoryError) {
      return (
        <div className="py-6 text-center">
          <p className="text-destructive">
            {t("ERROR_LOADING_TRANSACTIONS")}: {txnHistoryError?.message}
          </p>
        </div>
      );
    }

    if (sortedTransactions.length === 0) {
      return (
        <p className="py-6 text-center text-muted-foreground">
          {t("NO_TRANSACTIONS_FOUND")}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {sortedTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} {...transaction} />
        ))}
      </div>
    );
  };

  return (
    <>
      <NonHomeHeader title={t("TRANSACTIONS")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto">
        <section className="flex w-full flex-col justify-between gap-4 pt-6">
          {/* Always show filter button - it's not dependent on data loading */}
          {isTxnHistoryPending ? (
            <TransactionsSummarySkeleton
              filterButton={
                <TransactionFiltersDrawer
                  filters={filters}
                  onFiltersChange={handleFiltersChange}>
                  <Button variant="outline" size="icon">
                    <Filter className="size-4 text-primary" />
                  </Button>
                </TransactionFiltersDrawer>
              }
            />
          ) : (
            <TransactionsSummary
              transactions={filteredTransactions}
              onDownload={handleDownload}
              isError={isTxnHistoryError}
              hasFilters={appliedFilters.length > 0}
              filterButton={
                <TransactionFiltersDrawer
                  filters={filters}
                  onFiltersChange={handleFiltersChange}>
                  <Button variant="outline" size="icon">
                    <Filter className="size-4 text-primary" />
                  </Button>
                </TransactionFiltersDrawer>
              }
            />
          )}
        </section>

        <section className="flex w-full flex-col justify-between gap-4 py-2">
          <div className="mt-4 space-y-4">{renderContent()}</div>
        </section>

        <section className="mb-6 flex w-full flex-col justify-between gap-4 py-2">
          <SectionHeader title={t("FAQS")} seeAllLink={INTERNAL_HREFS.HELP} />
          <FAQAccordion faqs={getPageFAQs("TRANSACTIONS_PAGE")} showAll />
        </section>
      </main>
    </>
  );
}
