import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics, useTxLimits } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

export function PerTxnLimit() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { track } = useAnalytics();
  const { txLimit, isTxLimitLoading, isTxLimitError } = useTxLimits();
  // Never render a placeholder `$0` while loading: it reads as "you can't
  // trade". Show a skeleton until real numbers arrive.
  const isLoading = isTxLimitLoading || (!txLimit && !isTxLimitError);

  useEffect(() => {
    if (isTxLimitError) {
      track(EVENTS.FEATURE, {
        status: "load_error_shown",
        location: "homescreen",
        section: "limits",
      });
    }
  }, [isTxLimitError, track]);

  const handleRetry = () => {
    queryClient.refetchQueries({ queryKey: ["tx-limit"] });
  };

  const renderAmount = (amount: number | undefined) =>
    isLoading ? (
      <Skeleton className="mt-1 h-8 w-20" />
    ) : (
      <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
        ${truncateAmount(amount ?? 0, 1)}
      </p>
    );

  return (
    <Card className="w-full border-none bg-primary/5">
      <CardHeader>
        <CardTitle>{t("PER_TRANSACTION_LIMITS")}</CardTitle>
        <CardDescription>
          {t("PER_TRANSACTION_LIMITS_DESCRIPTION")}
        </CardDescription>
      </CardHeader>
      {isTxLimitError ? (
        <CardContent>
          <div
            role="alert"
            className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive text-sm">
                {t("ONB_LIMITS_LOAD_ERROR")}
              </p>
              <p className="text-destructive text-xs">
                {t("ONB_CHECK_CONNECTION_TRY_AGAIN")}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              <RotateCw className="size-4" />
              {t("RETRY")}
            </Button>
          </div>
        </CardContent>
      ) : (
        <CardContent className="flex items-center gap-4">
          <div className="flex w-full items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-background">
              <ASSETS.ICONS.Buy className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {t("BUY")}
              </p>
              {renderAmount(txLimit?.buyLimit)}
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-background">
              <ASSETS.ICONS.Sell className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {t("SELL")}/{t("PAY")}
              </p>
              {renderAmount(txLimit?.sellLimit)}
            </div>
          </div>
        </CardContent>
      )}
      <CardFooter>
        <Link
          to={INTERNAL_HREFS.LIMITS}
          className="rounded-md border border-primary bg-transparent px-4 py-2"
          viewTransition
          style={{
            viewTransitionName: "limits",
          }}>
          <p className="font-medium text-primary text-sm">
            {t("INCREASE_TRANSACTION_LIMITS")}
          </p>
        </Link>
      </CardFooter>
    </Card>
  );
}
