import { ExternalLink, Info, Ticket } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PrizerailDrawInfoDrawer } from "@/components/prizerail-draw-info-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePrizerailDraws } from "@/hooks/use-prizerail-draws";
import type { CurrencyType } from "@/lib/constants";
import {
  entriesForOrderUsdc,
  getDrawEntryPercent,
  getPrizerailCampaignSlug,
  getPrizerailCampaignUrl,
} from "@/lib/prizerail";

interface PrizerailDrawCardProps {
  currency?: CurrencyType;
  /** The order's USDC amount as the Order schema formats it ("12.5"). */
  usdcAmount: string | number;
}

/**
 * "This order earned N draw entries" card shown on BUY/SELL completion.
 * Replaces the LotPot cashback credit card: the executor now turns the
 * same per-market percentage into Prizerail draw entries (one per cent)
 * instead of issuing credit. Entries are sent server-side, so the card can
 * promise them without waiting on any on-chain signal.
 *
 * Hidden when the campaign is not configured (VITE_PRIZERAIL_CAMPAIGN_SLUG)
 * and in 0% markets. The next-draw line is best-effort from the public feed
 * and simply does not render if the feed is unavailable.
 */
export function PrizerailDrawCard({
  currency,
  usdcAmount,
}: PrizerailDrawCardProps) {
  const { t } = useTranslation();
  const slug = getPrizerailCampaignSlug();
  const { data: draws } = usePrizerailDraws();
  const [infoOpen, setInfoOpen] = useState(false);

  const percentage = getDrawEntryPercent(currency);
  if (!slug || percentage <= 0) {
    return null;
  }

  const entries = entriesForOrderUsdc(usdcAmount, percentage);
  const nextDraw = draws?.nextDraw ?? null;
  const nextDrawAt = nextDraw ? moment(nextDraw.drawAt) : null;
  // "Today at 5:00 PM" / "Tomorrow at …", localised by moment. Shown in
  // the explainer, not on the card, to keep the card to one sentence.
  const nextDrawLabel =
    nextDraw && nextDrawAt?.isValid() ? nextDrawAt.calendar() : null;
  const poolLabel =
    typeof nextDraw?.entrantCount === "number" &&
    typeof nextDraw.totalEntries === "number"
      ? t("PRIZERAIL_DRAW_POOL", {
          entrants: nextDraw.entrantCount.toLocaleString(),
          entries: nextDraw.totalEntries.toLocaleString(),
        })
      : null;

  const campaignUrl = getPrizerailCampaignUrl(slug);
  const handleViewDraw = () => {
    window.open(campaignUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="w-full shadow-none">
      <CardContent className="pt-1">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-3">
              <Ticket className="size-5 text-primary" />
              <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
                {t("PRIZERAIL_DRAW_TITLE")}
              </p>
              <button
                type="button"
                aria-label={t("PRIZERAIL_INFO_BUTTON")}
                onClick={() => setInfoOpen(true)}
                className="ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                <Info className="size-4" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("PRIZERAIL_DRAW_ORDER_DESCRIPTION", {
                entries: entries.toLocaleString(),
              })}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:items-end">
            <Button
              variant="default"
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={handleViewDraw}>
              <ExternalLink className="size-4" />
              {t("PRIZERAIL_VIEW_DRAW")}
            </Button>
          </div>
        </div>
      </CardContent>
      <PrizerailDrawInfoDrawer
        open={infoOpen}
        onOpenChange={setInfoOpen}
        percentage={percentage}
        campaignUrl={campaignUrl}
        nextDrawLabel={nextDrawLabel}
        poolLabel={poolLabel}
      />
    </Card>
  );
}
