import { Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLotpotCredits,
  useP2PTokenInfo,
  useP2pRewardBalance,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";

const LOTPOT_FALLBACK_URL = "https://lotpot.fun";
const LOTPOT_UTM_QUERY = "?utm_source=p2p-credits";

const tileClassName =
  "flex flex-1 items-center gap-3 rounded-2xl bg-background p-4 text-left transition-colors hover:bg-background/70";

export function RewardsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: p2pBalance } = useP2pRewardBalance();
  const { tokenInfo } = useP2PTokenInfo();
  const { data: credits } = useLotpotCredits();

  const hasP2p = !!p2pBalance?.hasBalance;
  const hasCredits = !!credits?.hasCredits;

  if (!hasP2p && !hasCredits) return null;

  const price = tokenInfo?.market.usdPrice ?? null;
  const p2pAmount = p2pBalance
    ? Number(formatUnits(p2pBalance.rawAmount, 6))
    : 0;
  const p2pUsd = price != null ? p2pAmount * price : null;

  const handleViewP2P = () => navigate(INTERNAL_HREFS.P2P_TOKEN);
  const handleOpenLotpot = () => {
    const base = import.meta.env.VITE_LOTPOT_URL ?? LOTPOT_FALLBACK_URL;
    window.open(`${base}${LOTPOT_UTM_QUERY}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <Card className="w-full gap-3 border-none bg-primary/5 px-6 pt-4 pb-4">
        <CardHeader className="p-0">
          <CardTitle>{t("REWARDS")}</CardTitle>
        </CardHeader>
        <div className="flex w-full items-stretch gap-3">
          {hasP2p && (
            <button
              type="button"
              onClick={handleViewP2P}
              className={tileClassName}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ASSETS.ICONS.Logo className="size-5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-base text-foreground">
                  {p2pBalance?.displayAmount} ${p2pBalance?.tokenSymbol}
                </span>
                {p2pUsd != null && (
                  <span className="text-muted-foreground text-xs">
                    ≈ ${p2pUsd.toFixed(3)}
                  </span>
                )}
              </div>
            </button>
          )}
          {hasCredits && (
            <button
              type="button"
              onClick={handleOpenLotpot}
              className={tileClassName}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Gift className="size-5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-base text-foreground">
                  {credits?.displayAmount} {t("LOTPOT_CREDITS_UNIT")}
                </span>
                {credits?.formattedUsdValue && (
                  <span className="text-muted-foreground text-xs">
                    {credits.formattedUsdValue}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
