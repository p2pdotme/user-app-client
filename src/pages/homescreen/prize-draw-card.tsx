import { ArrowRight, Clock } from "lucide-react";
import moment from "moment";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  DrawCountdown,
  DrawCountdownSkeleton,
} from "@/components/prizerail-draw-countdown";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts";
import { usePrizerailDraws } from "@/hooks/use-prizerail-draws";
import { type CurrencyType, INTERNAL_HREFS } from "@/lib/constants";
import {
  getDrawEntryPercent,
  getPrizerailCampaignSlug,
  getPrizerailUserApiUrl,
  PRIZERAIL_HEADLINE_PRIZE_CENTS,
} from "@/lib/prizerail";

/**
 * Homescreen entry point to the in-app PrizeRail Draws page. Shown only in
 * markets that earn draw entries (hidden at 0%, e.g. VEN/BOB), and only when
 * the programme is on and the user API backing /prize-draw is configured.
 * The headline prize is fixed copy; the countdown shows once the public
 * feed has an open draw.
 */
export function PrizeDrawCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    settings: { currency },
  } = useSettings();
  const {
    data: draws,
    isLoading: isDrawsLoading,
    refetch: refetchDraws,
  } = usePrizerailDraws();

  const isAvailable =
    !!getPrizerailCampaignSlug() &&
    !!getPrizerailUserApiUrl() &&
    getDrawEntryPercent(currency.currency as CurrencyType) > 0;
  if (!isAvailable) return null;

  const nextDrawAt = draws?.nextDraw ? moment(draws.nextDraw.drawAt) : null;
  const hasNextDraw = !!nextDrawAt?.isValid();

  // Whole dollars: "$100,000", not "$100,000.00".
  const headlinePrize = `$${(PRIZERAIL_HEADLINE_PRIZE_CENTS / 100).toLocaleString("en-US")}`;

  return (
    <section className="flex w-full flex-col items-center justify-center py-4">
      <button
        type="button"
        onClick={() => navigate(INTERNAL_HREFS.PRIZE_DRAW)}
        className="w-full rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-4 text-left">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-8">
            <div className="flex flex-col gap-2">
              <CardTitle>{t("PRIZERAIL_DRAWS")}</CardTitle>
              <CardDescription>
                <Trans
                  i18nKey="PRIZERAIL_HOME_DESCRIPTION"
                  values={{ amount: headlinePrize }}>
                  <span className="whitespace-nowrap font-semibold text-primary" />
                </Trans>
              </CardDescription>
            </div>
            <ArrowRight className="size-5 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-primary/10 border-t pt-3">
            <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {hasNextDraw || isDrawsLoading
                  ? t("PRIZERAIL_HOME_ANNOUNCED_IN")
                  : t("PRIZERAIL_VIEW_DRAW")}
              </span>
            </div>
            {isDrawsLoading && <DrawCountdownSkeleton />}
            {nextDrawAt && hasNextDraw && (
              // Keyed by draw so a new draw restarts the countdown.
              <DrawCountdown
                key={draws?.nextDraw?.id}
                targetMs={nextDrawAt.valueOf()}
                onElapsed={refetchDraws}
              />
            )}
          </div>
        </div>
      </button>
    </section>
  );
}
