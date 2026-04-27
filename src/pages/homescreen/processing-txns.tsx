import type { CurrencyCode as CurrencyType } from "@p2pdotme/sdk";
import { AlertCircle, AlertTriangle, ChevronRight, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import ASSETS from "@/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrichedSubgraphOrder } from "@/core/p2pdotme/shared/validation";
import { useProcessingTxns } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { cn, formatFiatAmount } from "@/lib/utils";

export function ProcessingTransactions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    error,
    isFetched,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProcessingTxns();

  // Flatten all pages of data
  const allTransactions = data?.pages.flatMap((page) => page.data) ?? [];

  const handleTransactionClick = (orderId: string) => {
    navigate(`${INTERNAL_HREFS.ORDER}/${orderId}`);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isFetched && allTransactions.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col justify-center py-4">
      <h3 className="font-medium text-lg">{t("PROCESSING_TRANSACTIONS")}</h3>
      {isLoading ? (
        <ScrollArea className="w-full py-2">
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProcessingTransactionSkeleton key={i} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-destructive text-sm">
              {t("ERROR_LOADING_TRANSACTIONS")}
            </p>
            <p className="text-destructive/80 text-xs">
              {error?.message || "An unknown error occurred"}
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="w-full py-2">
          <div className="flex gap-4">
            {allTransactions.map((transaction) => {
              const enrichedTx = transaction as EnrichedSubgraphOrder;
              // Use actual amounts from contract data (after fees)
              // If contract data is not available, fall back to base amounts(old transactions? )
              const cryptoAmount =
                enrichedTx.contractFeeDetails?.actualUsdtAmount ??
                parseFloat(enrichedTx.usdcAmount);
              const fiatAmount =
                enrichedTx.contractFeeDetails?.actualFiatAmount ??
                parseFloat(enrichedTx.fiatAmount);

              return (
                <ProcessingTransactionItem
                  key={transaction.orderId}
                  id={transaction.orderId}
                  type={transaction.type}
                  cryptoAmount={cryptoAmount}
                  fiatAmount={fiatAmount}
                  currency={transaction.currency as CurrencyType}
                  status={transaction.status}
                  disputeStatus={transaction.disputeStatus}
                  onClick={() => handleTransactionClick(transaction.orderId)}
                />
              );
            })}
            {hasNextPage && (
              <div className="flex w-[200px] items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="w-full">
                  {isFetchingNextPage ? `${t("LOADING")}...` : t("LOAD_MORE")}
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      )}
    </section>
  );
}

function ProcessingTransactionSkeleton() {
  return (
    <Card className="w-[300px] py-4">
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="mx-3 flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ProcessingTransactionItemProps {
  id: string;
  type: "BUY" | "SELL" | "PAY";
  cryptoAmount: number;
  fiatAmount: number;
  currency: CurrencyType;
  status: string;
  disputeStatus: "RAISED" | "SETTLED" | "DEFAULT";
  onClick: () => void;
}

function ProcessingTransactionItem({
  id,
  type,
  cryptoAmount,
  fiatAmount,
  currency,
  status,
  disputeStatus,
  onClick,
}: ProcessingTransactionItemProps) {
  const { t } = useTranslation();
  const TypeIcon =
    type === "BUY"
      ? ASSETS.ICONS.Buy
      : type === "SELL"
        ? ASSETS.ICONS.Sell
        : ASSETS.ICONS.Pay;

  const isDisputeRaised = disputeStatus === "RAISED";
  const isDisputeSettled = disputeStatus === "SETTLED";

  const statusText =
    status === "ACCEPTED" || (type !== "BUY" && status === "PAID")
      ? t("ACTION_NEEDED")
      : t("PROCESSING");

  const statusVariant =
    status === "ACCEPTED" || (type !== "BUY" && status === "PAID")
      ? "destructive"
      : "outline";

  return (
    <Card
      className="w-[300px] cursor-pointer py-4 transition-colors hover:bg-accent/50"
      onClick={onClick}>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-1">
              <TypeIcon className="size-4 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{t(type)} USDC</p>
          </div>
          <div className="flex items-center gap-2">
            {isDisputeRaised && (
              <div className="flex items-center gap-1 rounded-full border border-warning/20 bg-warning/15 px-2 py-1">
                <AlertTriangle className="size-3 text-warning" />
                <span className="font-medium text-warning text-xs">
                  {t("DISPUTED")}
                </span>
              </div>
            )}
            {isDisputeSettled && (
              <div className="flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/15 px-2 py-1">
                <Shield className="size-3 text-blue-500" />
                <span className="font-medium text-blue-500 text-xs">
                  {t("DISPUTE_SETTLED")}
                </span>
              </div>
            )}
            <Badge
              variant={statusVariant}
              className={cn(
                "rounded-full bg-transparent px-2 py-1 font-medium",
                statusVariant === "destructive" &&
                  "border-destructive/20 bg-destructive/15 text-destructive",
                statusVariant === "outline" &&
                  "border-primary/20 bg-primary/15 text-muted-foreground",
              )}>
              {statusText}
            </Badge>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <ASSETS.ICONS.Usdc className="size-12 text-primary" />

          <div className="mx-3 flex-1">
            <p className={`font-medium text-sm`}>
              {type === "BUY" ? "+" : "-"} {cryptoAmount} USDC
            </p>
            <div className="mt-1 flex items-center text-muted-foreground text-xs">
              {type === "BUY" ? "-" : "+"}
              <span>{formatFiatAmount(fiatAmount, currency)}</span>
              <Separator orientation="vertical" className="mx-2 h-3" />
              <span>ID: {id}</span>
            </div>
          </div>

          <ChevronRight className="size-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
