import { Clock } from "lucide-react";
import moment from "moment";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DrawCountdown } from "@/components/prizerail-draw-countdown";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { UserDrawingEntries } from "@/core/prizerail/user-api";
import { INTERNAL_HREFS } from "@/lib/constants";
import { CurrentDrawSkeleton } from "./skeletons";
import { CURRENT_DRAW_SURFACE } from "./surface";

interface CurrentDrawCardProps {
  drawing: UserDrawingEntries | null;
  isLoading: boolean;
}

function EnteredBody({ drawing }: { drawing: UserDrawingEntries }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline gap-2">
      <p className="font-semibold text-4xl text-foreground tabular-nums">
        {drawing.entries.toLocaleString()}
      </p>
      <p className="text-muted-foreground text-sm">
        {t("PRIZERAIL_YOUR_ENTRIES")}
      </p>
    </div>
  );
}

function NotEnteredBody() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        className="h-11 rounded-xl font-semibold"
        onClick={() => navigate(INTERNAL_HREFS.BUY)}>
        {t("BUY")}
      </Button>
      <Button
        variant="outline"
        className="h-11 rounded-xl border-primary/30 bg-background/60 font-semibold"
        onClick={() => navigate(INTERNAL_HREFS.SELL)}>
        {t("SELL")}
      </Button>
    </div>
  );
}

function Surface({ children }: { children: ReactNode }) {
  return <section className={CURRENT_DRAW_SURFACE}>{children}</section>;
}

/** The wallet's standing in the draw taking entries now. */
export function CurrentDrawCard({ drawing, isLoading }: CurrentDrawCardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <CurrentDrawSkeleton />;
  }

  if (!drawing) {
    return (
      <Surface>
        <CardTitle>{t("PRIZERAIL_CURRENT_DRAW")}</CardTitle>
        <CardDescription>{t("PRIZERAIL_NO_OPEN_DRAW")}</CardDescription>
      </Surface>
    );
  }

  const drawAt = drawing.drawAt ? moment(drawing.drawAt) : null;
  const hasDrawAt = !!drawAt?.isValid();

  return (
    <Surface>
      <div className="flex flex-col gap-2">
        <CardTitle>{t("PRIZERAIL_CURRENT_DRAW")}</CardTitle>
        {!drawing.entered && (
          <CardDescription>{t("PRIZERAIL_NOT_ENTERED_YET")}</CardDescription>
        )}
      </div>

      {drawing.entered ? <EnteredBody drawing={drawing} /> : <NotEnteredBody />}

      {(hasDrawAt || drawing.entrantCount > 0) && (
        <div className="flex flex-col gap-2 border-primary/10 border-t pt-3">
          {drawAt && hasDrawAt && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Clock className="size-3.5 shrink-0" />
                <span>{t("PRIZERAIL_HOME_ANNOUNCED_IN")}</span>
              </div>
              <DrawCountdown
                key={drawing.drawingId}
                targetMs={drawAt.valueOf()}
              />
            </div>
          )}
          {/* "0 players · 0 entries" reads as broken; show the pool once
              someone is in. */}
          {drawing.entrantCount > 0 && (
            <p className="text-muted-foreground text-xs">
              {t("PRIZERAIL_DRAW_POOL", {
                entrants: drawing.entrantCount.toLocaleString(),
                entries: drawing.totalEntries.toLocaleString(),
              })}
            </p>
          )}
        </div>
      )}
    </Surface>
  );
}
