import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAnalytics } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { DownloadConfirmationDrawer } from "./download-confirmation-drawer";
import type { Transaction } from "./shared";

// Fixed text size to prevent CLS - no dynamic sizing based on content
const STAT_TEXT_SIZE = "text-xl sm:text-3xl";

export function TransactionsSummary({
  transactions,
  onDownload,
  isError,
  hasFilters,
  filterButton,
}: {
  transactions: Transaction[];
  onDownload?: () => void;
  isError?: boolean;
  hasFilters?: boolean;
  filterButton?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState(false);

  // Calculate summary statistics for all transactions
  const summaryStats = useMemo(() => {
    const buyVolume = transactions
      .filter((tx) => tx.type === "BUY")
      .reduce((sum, tx) => sum + tx.cryptoAmount, 0);

    const sellPayVolume = transactions
      .filter((tx) => tx.type === "SELL" || tx.type === "PAY")
      .reduce((sum, tx) => sum + tx.cryptoAmount, 0);

    const completedCount = transactions.filter(
      (tx) => tx.status === "COMPLETED",
    ).length;

    return {
      buyVolume: new Intl.NumberFormat("en-US", {
        notation: "compact",
      }).format(buyVolume),
      sellPayVolume: new Intl.NumberFormat("en-US", {
        notation: "compact",
      }).format(sellPayVolume),
      completedCount: new Intl.NumberFormat("en-US", {
        notation: "compact",
      }).format(completedCount),
    };
  }, [transactions]);

  const handleDownloadClick = () => {
    track(EVENTS.TRANSACTION, {
      status: "download_initiated",
      transactionCount: transactions.length,
      completedCount: transactions.filter((tx) => tx.status === "COMPLETED")
        .length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.cryptoAmount, 0),
    });
    setIsDownloadDrawerOpen(true);
  };

  const handleConfirmDownload = () => {
    track(EVENTS.TRANSACTION, {
      status: "download_confirmed",
      transactionCount: transactions.length,
      completedCount: transactions.filter((tx) => tx.status === "COMPLETED")
        .length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.cryptoAmount, 0),
    });
    if (onDownload) {
      onDownload();
    }
    setIsDownloadDrawerOpen(false);
  };

  return (
    <>
      <Card className="w-full gap-1 rounded-xl border-none bg-primary/10 p-0 shadow-none">
        <CardHeader className="gap-0 rounded-xl bg-primary/15 p-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>
                <p>
                  {hasFilters
                    ? t("YOUR_ACTIVITY_FILTERED")
                    : t("YOUR_ACTIVITY")}
                </p>
              </CardTitle>
              {!hasFilters && (
                <p className="text-muted-foreground text-xs">
                  {t("SHOWING_SANE_DEFAULTS")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {filterButton}
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownloadClick}
                disabled={isError || transactions.length === 0}>
                <Download className="size-4 text-primary" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex w-full items-center justify-between gap-1 px-2 py-2 sm:gap-2 sm:px-4">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
            <p
              className={cn(
                "w-full truncate bg-linear-to-b from-primary to-primary/40 bg-clip-text text-center font-bold text-transparent",
                STAT_TEXT_SIZE,
              )}>
              {summaryStats.buyVolume}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              {t("BUY_VOLUME")}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              USDC
            </p>
          </div>

          <Separator orientation="vertical" className="h-12 sm:h-16" />

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
            <p
              className={cn(
                "w-full truncate bg-linear-to-b from-primary to-primary/40 bg-clip-text text-center font-bold text-transparent",
                STAT_TEXT_SIZE,
              )}>
              {summaryStats.sellPayVolume}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              {t("SELL_PAY_VOLUME")}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              USDC
            </p>
          </div>

          <Separator orientation="vertical" className="h-12 sm:h-16" />

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-colors">
            <p
              className={cn(
                "w-full truncate bg-linear-to-b from-primary to-primary/40 bg-clip-text text-center font-bold text-transparent",
                STAT_TEXT_SIZE,
              )}>
              {summaryStats.completedCount}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              {t("COMPLETED")}
            </p>
            <p className="text-center text-muted-foreground text-xs sm:text-sm">
              {t("TRANSACTIONS")}
            </p>
          </div>
        </CardContent>
      </Card>
      <DownloadConfirmationDrawer
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
        onConfirm={handleConfirmDownload}
        transactions={transactions}
        hasFilters={hasFilters}
      />
    </>
  );
}
