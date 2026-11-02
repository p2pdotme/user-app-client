import { ChevronRight, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components/non-home-header";
import { PrizerailDrawInfoDrawer } from "@/components/prizerail-draw-info-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts";
import { usePageMeta } from "@/hooks/use-page-meta";
import { usePrizerailCampaignDetails } from "@/hooks/use-prizerail-campaign";
import { usePrizerailUserSummary } from "@/hooks/use-prizerail-user";
import type { CurrencyType } from "@/lib/constants";
import {
  getDrawEntryPercent,
  getPrizerailCampaignSlug,
  getPrizerailCampaignUrl,
  getPrizerailUserApiUrl,
} from "@/lib/prizerail";
import { CurrentDrawCard } from "./current-draw-card";
import { DrawHistory } from "./draw-history";
import { WonSummary } from "./won-summary";

/**
 * PrizeRail Draws: the signed-in wallet's winnings, its real entries in the
 * open Prizerail draw, what the campaign has paid out so far, and the past
 * draws it entered — all read from the Prizerail user API. Linked from the draw card on order completion and the homescreen
 * card. The "How the prize draw works" card opens the rules drawer.
 */
export function PrizeDraw() {
  const { t } = useTranslation();
  usePageMeta({ title: t("PRIZERAIL_DRAWS") });
  const slug = getPrizerailCampaignSlug();
  const enabled = !!slug && !!getPrizerailUserApiUrl();
  const summary = usePrizerailUserSummary();
  const campaign = usePrizerailCampaignDetails();
  const {
    settings: { currency },
  } = useSettings();
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleViewOnPrizerail = () => {
    if (!slug) return;
    window.open(getPrizerailCampaignUrl(slug), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <NonHomeHeader title={t("PRIZERAIL_DRAWS")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-5 overflow-y-auto py-6">
        {!enabled ? (
          <p className="text-muted-foreground text-sm">
            {t("PRIZERAIL_UNAVAILABLE")}
          </p>
        ) : (
          <>
            {summary.isError ? (
              <Card className="w-full shadow-none">
                <CardContent className="flex flex-col items-start gap-3 text-sm">
                  <p className="text-muted-foreground">
                    {t("PRIZERAIL_LOAD_ERROR")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => summary.refetch()}>
                    {t("TRY_AGAIN")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <WonSummary
                  wins={summary.data?.wins}
                  isLoading={summary.isLoading}
                  stats={campaign.data?.stats}
                  isStatsLoading={campaign.isLoading}
                />
                <CurrentDrawCard
                  drawing={summary.data?.currentDrawing ?? null}
                  winnersPerDraw={campaign.data?.winnersPerDraw ?? null}
                  isLoading={summary.isLoading}
                />
              </>
            )}

            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="flex w-full items-center gap-4 rounded-xl bg-primary/5 px-6 py-4 text-left transition-colors hover:bg-primary/10">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Info className="size-5 text-primary" />
              </div>
              <p className="min-w-0 flex-1 font-semibold text-foreground">
                {t("PRIZERAIL_INFO_TITLE")}
              </p>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>

            <section className="flex flex-col gap-3">
              <h2 className="px-1 font-medium text-foreground">
                {t("PRIZERAIL_PAST_DRAWS")}
              </h2>
              <DrawHistory />
            </section>

            <Button
              variant="ghost"
              className="gap-2 self-center text-muted-foreground"
              onClick={handleViewOnPrizerail}>
              <ExternalLink className="size-4" />
              {t("PRIZERAIL_VIEW_ON_PRIZERAIL")}
            </Button>
          </>
        )}
      </main>
      {slug && (
        <PrizerailDrawInfoDrawer
          open={rulesOpen}
          onOpenChange={setRulesOpen}
          percentage={getDrawEntryPercent(currency.currency as CurrencyType)}
        />
      )}
    </>
  );
}
