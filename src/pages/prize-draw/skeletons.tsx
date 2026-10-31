import { useTranslation } from "react-i18next";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENT_DRAW_SURFACE } from "./surface";

// Loading placeholders shaped like the real cards: same containers, same
// rows, bars where text and numbers will land, so nothing jumps on load.
// Real labels stay visible; only the data pulses.

// Matches the history page size (DRAWS_STEP in draw-history.tsx).
const PLACEHOLDER_ROWS = 5;

export function WonSummarySkeleton() {
  const { t } = useTranslation();
  return (
    <section
      aria-busy="true"
      className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
          {t("PRIZERAIL_TOTAL_WON")}
        </p>
        <Skeleton className="h-9 w-32 bg-background/70" />
        <Skeleton className="h-4 w-24 bg-background/70" />
      </div>
      <Skeleton className="size-14 shrink-0 rounded-full bg-background/70" />
    </section>
  );
}

export function CurrentDrawSkeleton() {
  const { t } = useTranslation();
  return (
    <section aria-busy="true" className={CURRENT_DRAW_SURFACE}>
      <CardTitle>{t("PRIZERAIL_CURRENT_DRAW")}</CardTitle>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-24 bg-background/70" />
        <Skeleton className="h-2 w-full rounded-full bg-background/70" />
        <Skeleton className="h-3 w-36 bg-background/70" />
      </div>
      <div className="flex items-center justify-between gap-2 border-primary/10 border-t pt-3">
        <Skeleton className="h-3 w-40 bg-background/70" />
        <Skeleton className="h-6 w-28 bg-background/70" />
      </div>
    </section>
  );
}

export function DrawRowSkeleton() {
  return (
    <li className="flex items-center gap-3 py-3">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-12 shrink-0" />
    </li>
  );
}

export function DrawHistorySkeleton({
  rows = PLACEHOLDER_ROWS,
}: {
  rows?: number;
}) {
  return (
    <Card aria-busy="true" className="w-full shadow-none">
      <CardContent>
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }, (_, i) => (
            <DrawRowSkeleton key={`placeholder-${i}`} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
