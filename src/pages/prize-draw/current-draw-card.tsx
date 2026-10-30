import { Clock, Ticket } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserDrawingEntries } from "@/core/prizerail/user-api";
import { INTERNAL_HREFS } from "@/lib/constants";
import { CurrentDrawSkeleton } from "./skeletons";

// The "Draws in …" pill is relative time; refresh it while the page is open.
const CLOCK_TICK_MS = 30_000;

interface CurrentDrawCardProps {
  drawing: UserDrawingEntries | null;
  isLoading: boolean;
}

function useNow(tickMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

function formatShare(share: number): string {
  if (share <= 0) return "0%";
  // Two decimals under 1% so a small share never reads as "0%".
  return `${(share * 100).toFixed(share < 0.01 ? 2 : 1)}%`;
}

function DrawCountdown({ drawAt }: { drawAt: string | null }) {
  const { t } = useTranslation();
  const now = useNow(CLOCK_TICK_MS);
  const at = drawAt ? moment(drawAt) : null;
  if (!at?.isValid()) return null;

  const label =
    at.valueOf() <= now
      ? t("PRIZERAIL_DRAWING_NOW")
      : t("PRIZERAIL_DRAWS_IN", { time: at.from(now) });

  return (
    <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs">
      <Clock className="size-3" />
      {label}
    </span>
  );
}

/** The wallet's standing in the draw taking entries now. */
export function CurrentDrawCard({ drawing, isLoading }: CurrentDrawCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return <CurrentDrawSkeleton />;
  }

  if (!drawing) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="flex items-center gap-3 text-muted-foreground text-sm">
          <Clock className="size-5 shrink-0" />
          {t("PRIZERAIL_NO_OPEN_DRAW")}
        </CardContent>
      </Card>
    );
  }

  const drawAt = drawing.drawAt ? moment(drawing.drawAt) : null;
  const drawLabel = drawAt?.isValid() ? drawAt.calendar() : null;

  return (
    <Card className="w-full shadow-none">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Ticket className="size-5 text-primary" />
          <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
            {t("PRIZERAIL_CURRENT_DRAW")}
          </p>
          <DrawCountdown drawAt={drawing.drawAt} />
        </div>

        {drawing.entered ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2">
              <p className="font-semibold text-4xl text-foreground tabular-nums">
                {drawing.entries.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("PRIZERAIL_YOUR_ENTRIES")}
              </p>
            </div>
            <Progress
              value={Math.min(100, drawing.shareOfEntries * 100)}
              className="h-2"
              aria-label={t("PRIZERAIL_SHARE_OF_ENTRIES")}
            />
            <p className="text-muted-foreground text-xs">
              <span className="font-medium text-foreground">
                {formatShare(drawing.shareOfEntries)}
              </span>{" "}
              {t("PRIZERAIL_SHARE_OF_ENTRIES")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-foreground text-sm leading-relaxed">
              {t("PRIZERAIL_NOT_ENTERED_YET")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="rounded-full"
                onClick={() => navigate(INTERNAL_HREFS.BUY)}>
                {t("BUY")}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate(INTERNAL_HREFS.SELL)}>
                {t("SELL")}
              </Button>
            </div>
          </div>
        )}

        {(drawLabel || drawing.entrantCount > 0) && (
          <div className="flex flex-col gap-1 border-border border-t pt-3 text-muted-foreground text-xs">
            {drawLabel && (
              <p>{t("PRIZERAIL_NEXT_DRAW", { time: drawLabel })}</p>
            )}
            {/* "0 players · 0 entries" reads as broken; show the pool once
                someone is in. */}
            {drawing.entrantCount > 0 && (
              <p>
                {t("PRIZERAIL_DRAW_POOL", {
                  entrants: drawing.entrantCount.toLocaleString(),
                  entries: drawing.totalEntries.toLocaleString(),
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
