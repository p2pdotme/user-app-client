import { ArrowRight, Bitcoin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCbBtcBalance, useCbBtcPrice, useThirdweb } from "@/hooks";

const COINSME_APP_URL = "https://app.coins.me";

export function CashbackEarnedCard() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useCbBtcBalance();
  const {
    data: price,
    isLoading: isPriceLoading,
    isError: isPriceError,
  } = useCbBtcPrice();

  const balanceQueryEnabled = !!account?.address;
  const isLoading = balanceQueryEnabled && (isBalanceLoading || isPriceLoading);

  if (isBalanceError || isPriceError) {
    return null;
  }
  if (!isLoading && (!balance || !balance.hasBalance)) {
    return null;
  }

  const handleOpenCoinsMe = () => {
    window.open(COINSME_APP_URL, "_blank", "noopener,noreferrer");
  };

  const usdValue = price?.getFormattedUsdValue(balance?.rawAmount ?? 0n) ?? "";

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <Card className="h-28 w-full justify-between gap-1 border-none bg-primary/5 px-6 pt-4 pb-2">
        {isLoading ? (
          <div className="flex w-full flex-col justify-between gap-1">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="mx-auto h-4 w-40" />
          </div>
        ) : (
          <>
            <CardHeader className="p-0">
              <CardTitle>{t("CASHBACK_EARNED")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-0">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bitcoin className="size-5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-lg">
                  {balance?.displayAmount} {balance?.tokenSymbol}
                </span>
              </div>
              {usdValue && (
                <span className="text-muted-foreground text-sm">
                  {usdValue}
                </span>
              )}
            </CardContent>
            <Button
              variant="link"
              onClick={handleOpenCoinsMe}
              className="h-auto p-0 no-underline hover:no-underline">
              {t("USE_CBBTC_ON_COINSME")}
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
