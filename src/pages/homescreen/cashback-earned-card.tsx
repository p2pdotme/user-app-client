import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2pRewardBalance, useP2PTokenInfo, useThirdweb } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";

export function CashbackEarnedCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account } = useThirdweb();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useP2pRewardBalance();
  const { tokenInfo, isTokenInfoLoading } =
    useP2PTokenInfo();

  const balanceQueryEnabled = !!account?.address;
  const isLoading =
    balanceQueryEnabled && (isBalanceLoading);

  if (isBalanceError) {
    return null;
  }
  if (!isLoading && (!balance || !balance.hasBalance)) {
    return null;
  }

  const handleViewP2PToken = () => {
    navigate(INTERNAL_HREFS.P2P_TOKEN);
  };

  const price = tokenInfo?.market.usdPrice ?? null;
  const balanceNum =
    balance?.rawAmount != null
      ? Number(formatUnits(balance.rawAmount, 6))
      : 0;
  const balanceUsd = price != null ? balanceNum * price : null;
  const usdValue = balanceUsd != null ? `≈ $${balanceUsd.toFixed(3)}` : "";

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
                  <ASSETS.ICONS.Logo className="size-5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-lg">
                  {balance?.displayAmount} ${balance?.tokenSymbol}
                </span>
              </div>
              {isTokenInfoLoading ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                usdValue && (
                  <span className="text-muted-foreground text-sm">
                    {usdValue}
                  </span>
                )
              )}
            </CardContent>
            <Button
              variant="link"
              onClick={handleViewP2PToken}
              className="h-auto p-0 no-underline hover:no-underline">
              {t("VIEW_P2P_TOKEN_HOLDINGS")}
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
