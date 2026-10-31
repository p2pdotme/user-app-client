import { Loader2, Ticket, Trophy } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UserDrawingEntries } from "@/core/prizerail/user-api";
import { usePrizerailUserDrawings } from "@/hooks/use-prizerail-user";
import { formatPrizeCents } from "@/lib/prizerail";
import { cn } from "@/lib/utils";
import { DrawHistorySkeleton, DrawRowSkeleton } from "./skeletons";

// Draws shown at first, and added by each "View more".
export const DRAWS_STEP = 5;

function DrawRow({ drawing }: { drawing: UserDrawingEntries }) {
  const { t } = useTranslation();
  const drawAt = drawing.drawAt ? moment(drawing.drawAt) : null;
  const label =
    drawing.drawingNumber !== null
      ? t("PRIZERAIL_DRAW_NUMBER", { number: drawing.drawingNumber })
      : t("PRIZERAIL_DRAW");
  const entries = t(
    drawing.entries === 1 ? "PRIZERAIL_ENTRY_COUNT" : "PRIZERAIL_ENTRIES_COUNT",
    { entries: drawing.entries.toLocaleString() },
  );

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          drawing.won ? "bg-success/15" : "bg-muted",
        )}>
        {drawing.won ? (
          <Trophy className="size-4 text-success" />
        ) : (
          <Ticket className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="truncate text-muted-foreground text-xs">
          {drawAt?.isValid() ? drawAt.format("MMM D, LT") : "—"} · {entries}
        </p>
      </div>
      {drawing.won ? (
        <p className="shrink-0 font-semibold text-sm text-success tabular-nums">
          +{formatPrizeCents(drawing.prizeCents ?? 0)}
        </p>
      ) : (
        <p className="shrink-0 text-muted-foreground text-xs">
          {t("PRIZERAIL_NOT_WON")}
        </p>
      )}
    </li>
  );
}

/** Past draws the wallet entered, newest first, with won / not won. */
export function DrawHistory() {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePrizerailUserDrawings();

  const [visibleCount, setVisibleCount] = useState(DRAWS_STEP);

  const drawings = data?.pages.flatMap((p) => p.items) ?? [];
  const visible = drawings.slice(0, visibleCount);
  const canShowMore = drawings.length > visibleCount || !!hasNextPage;

  // Reveal the next five from what is loaded; fetch another page only when
  // the loaded draws run out.
  const handleViewMore = () => {
    const next = visibleCount + DRAWS_STEP;
    if (drawings.length < next && hasNextPage) fetchNextPage();
    setVisibleCount(next);
  };

  if (isLoading) {
    return <DrawHistorySkeleton />;
  }

  if (isError) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="flex flex-col items-start gap-3 text-sm">
          <p className="text-muted-foreground">{t("PRIZERAIL_LOAD_ERROR")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("TRY_AGAIN")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-none">
      <CardContent className="flex flex-col">
        {drawings.length === 0 && !hasNextPage ? (
          <p className="py-2 text-muted-foreground text-sm">
            {t("PRIZERAIL_NO_PAST_DRAWS")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((d) => (
              <DrawRow key={d.drawingId} drawing={d} />
            ))}
            {isFetchingNextPage && visible.length < visibleCount && (
              <DrawRowSkeleton />
            )}
          </ul>
        )}
        {canShowMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 self-center"
            disabled={isFetchingNextPage}
            onClick={handleViewMore}>
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
            {t("PRIZERAIL_VIEW_MORE")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
