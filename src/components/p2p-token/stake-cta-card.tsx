import { ArrowRight, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useStakeBoostMetrics, useUserStake } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

/**
 * StakeCtaCard — promotional card inviting the user to stake $P2P to raise
 * their per-transaction limits.
 *
 * Reads `tokensPerUsd` and `maxBoostUsd` from `useStakeBoostMetrics` to
 * render the rate hint ("1 $P2P = +$X limit · max Y $P2P") and the
 * description headline ("up to +$X per transaction"). Clicking the CTA
 * navigates to the stake flow.
 */
export function StakeCtaCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { usdPerToken, maxBoostUsd } = useStakeBoostMetrics("0");
  const { userStake, isUserStakeLoading } = useUserStake();

  const hasRate =
    usdPerToken !== null && Number.isFinite(usdPerToken) && usdPerToken > 0;
  const hasActiveStake =
    userStake !== undefined && userStake !== null && userStake.stakedAmount > 0n;

  const handleClick = () => {
    navigate(
      hasActiveStake
        ? INTERNAL_HREFS.P2P_TOKEN_MY_STAKE
        : INTERNAL_HREFS.P2P_TOKEN_STAKE,
    );
  };

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
      <div className="inline-flex items-center gap-1.5 font-semibold text-[11px] text-primary uppercase tracking-[0.18em]">
        <Zap className="size-3.5" />
        {t("STAKE_CTA_INSTANT")}
      </div>

      <h3 className="mt-2 font-bold text-foreground text-xl tracking-tight">
        {t("STAKE_CTA_TITLE")}
      </h3>
      <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
        {t("STAKE_CTA_DESCRIPTION", {
          amount: truncateAmount(maxBoostUsd, 0),
        })}
      </p>

      {hasRate && (
        <div className="mt-3 flex items-stretch gap-2">
          <div className="flex-1 rounded-xl bg-background/60 px-3 py-2 flex flex-1 flex-col justify-center">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t("STAKE_CTA_RATE_STAKE")}
            </p>
            <p className="font-bold text-foreground text-sm tabular-nums">
              1 <span className="font-medium text-muted-foreground">$P2P</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/15">
              <ArrowRight className="size-3 text-primary" />
            </div>
          </div>
          <div className="flex-1 rounded-xl bg-background/60 px-3 py-2">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t("STAKE_CTA_RATE_UNLOCK")}
            </p>
            <p className="font-bold text-emerald-500 text-sm tabular-nums">
              +{truncateAmount(usdPerToken ?? 0)}{" "}
              <span className="font-medium text-[10px] text-muted-foreground">
                USDC
              </span>
              <span className="font-medium text-muted-foreground"> Limit </span>
            </p>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
              {t("BUY")}, {t("SELL")} & {t("PAY")}
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleClick}
        disabled={isUserStakeLoading}
        className="mt-3 w-full rounded-2xl py-6 font-semibold text-base"
      >
        {hasActiveStake ? t("STAKE_CTA_BUTTON_MY_STAKE") : t("STAKE_CTA_BUTTON")}
        <ArrowRight className="size-4" />
      </Button>
    </section>
  );
}
