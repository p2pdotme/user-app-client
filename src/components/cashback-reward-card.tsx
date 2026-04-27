import { ExternalLink, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCashbackConfig, useOrderCashback } from "@/hooks";

const COINSME_APP_URL = "https://app.coins.me";

interface CashbackRewardCardProps {
  orderId: number;
}

export function CashbackRewardCard({ orderId }: CashbackRewardCardProps) {
  const { t } = useTranslation();
  const { data: orderCashback, isLoading: isOrderCashbackLoading } =
    useOrderCashback(orderId);
  const { data: cashbackConfig, isLoading: isCashbackConfigLoading } =
    useCashbackConfig();
  const isLoading = isOrderCashbackLoading || isCashbackConfigLoading;

  if (!orderId || orderId <= 0) {
    return null;
  }

  if (!isLoading && (!orderCashback || !orderCashback.hasCashback)) {
    return null;
  }

  const cashbackPercentagePercent =
    cashbackConfig?.cashbackPercentagePercent ?? 0;
  const formattedCashbackPercentage =
    cashbackPercentagePercent > 0
      ? cashbackPercentagePercent.toLocaleString(undefined, {
          minimumFractionDigits: cashbackPercentagePercent < 1 ? 2 : 0,
          maximumFractionDigits: 2,
        })
      : "0";

  const description = orderCashback?.hasCashback
    ? t("CASHBACK_REWARD_DESCRIPTION", {
        tokenSymbol: orderCashback.tokenSymbol ?? t("TOKEN"),
        percentage: formattedCashbackPercentage,
      })
    : "";

  const handleOpenCoinsMe = () => {
    window.open(COINSME_APP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="w-full shadow-none">
      <CardContent className="pt-1">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-40 self-end" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-3">
                <Gift className="size-5 text-primary" />
                <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
                  {t("CASHBACK_REWARD_TITLE")}
                </p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <Button
                variant="default"
                size="lg"
                className="gap-2 rounded-full px-6"
                onClick={handleOpenCoinsMe}>
                <ExternalLink className="size-4" />
                {t("OPEN_COINS_ME")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
