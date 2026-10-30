import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NonHomeHeader } from "@/components/non-home-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { usePrizerailUserSummary } from "@/hooks/use-prizerail-user";
import {
  getPrizerailCampaignSlug,
  getPrizerailCampaignUrl,
  getPrizerailUserApiUrl,
} from "@/lib/prizerail";
import { CurrentDrawCard } from "./current-draw-card";
import { DrawHistory } from "./draw-history";
import { WonSummary } from "./won-summary";

/**
 * PrizeRail Draws: the signed-in wallet's winnings, its real entries in the
 * open Prizerail draw, and the past draws it entered — all read from the
 * Prizerail user API. Linked from the draw card on order completion.
 */
export function PrizeDraw() {
  const { t } = useTranslation();
  usePageMeta({ title: t("PRIZERAIL_DRAWS") });
  const slug = getPrizerailCampaignSlug();
  const enabled = !!slug && !!getPrizerailUserApiUrl();
  const summary = usePrizerailUserSummary();

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
                />
                <CurrentDrawCard
                  drawing={summary.data?.currentDrawing ?? null}
                  isLoading={summary.isLoading}
                />
              </>
            )}

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
    </>
  );
}
