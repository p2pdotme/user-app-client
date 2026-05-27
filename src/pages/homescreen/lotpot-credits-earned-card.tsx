import { ArrowRight, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLotpotCredits, useThirdweb } from "@/hooks";

const LOTPOT_FALLBACK_URL = "https://lotpot.fun";
const LOTPOT_UTM_QUERY = "?utm_source=p2p-credits";

export function LotpotCreditsEarnedCard() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: credits,
    isLoading: isCreditsLoading,
    isError,
  } = useLotpotCredits();

  const queryEnabled = !!account?.address;
  const isLoading = queryEnabled && isCreditsLoading;

  if (isError) {
    return null;
  }
  if (!isLoading && (!credits || !credits.hasCredits)) {
    return null;
  }

  const handleOpenLotpot = () => {
    const base = import.meta.env.VITE_LOTPOT_URL ?? LOTPOT_FALLBACK_URL;
    window.open(`${base}${LOTPOT_UTM_QUERY}`, "_blank", "noopener,noreferrer");
  };

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
              <CardTitle>{t("LOTPOT_CREDITS_EARNED")}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-0">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Gift className="size-5 text-primary" />
                </div>
                <span className="font-medium text-foreground text-lg">
                  {credits?.displayAmount} {t("LOTPOT_CREDITS_UNIT")}
                </span>
              </div>
              {credits?.formattedUsdValue && (
                <span className="text-muted-foreground text-sm">
                  {credits.formattedUsdValue}
                </span>
              )}
            </CardContent>
            <Button
              variant="link"
              onClick={handleOpenLotpot}
              className="h-auto p-0 no-underline hover:no-underline">
              {t("USE_CREDITS_ON_LOTPOT")}
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
