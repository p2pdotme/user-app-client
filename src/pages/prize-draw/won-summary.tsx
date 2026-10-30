import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserPrizeSummary } from "@/core/prizerail/user-api";
import { formatPrizeCents } from "@/lib/prizerail";
import { WonSummarySkeleton } from "./skeletons";

interface WonSummaryProps {
  wins: UserPrizeSummary["wins"] | undefined;
  isLoading: boolean;
}

/** Hero at the top of the page: everything the wallet has won so far. */
export function WonSummary({ wins, isLoading }: WonSummaryProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <WonSummarySkeleton />;
  }
  if (!wins) return null;

  const hasWins = wins.count > 0;

  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold text-primary text-xs uppercase tracking-[0.3em]">
          {t("PRIZERAIL_TOTAL_WON")}
        </p>
        <p className="font-semibold text-4xl text-foreground tabular-nums">
          {formatPrizeCents(wins.totalCents)}
        </p>
        <p className="text-muted-foreground text-sm">
          {hasWins
            ? t(
                wins.count === 1
                  ? "PRIZERAIL_WON_IN_DRAW"
                  : "PRIZERAIL_WON_IN_DRAWS",
                { count: wins.count },
              )
            : t("PRIZERAIL_NO_WINS_YET")}
        </p>
      </div>
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-background/70">
        <Trophy
          className={
            hasWins ? "size-7 text-primary" : "size-7 text-muted-foreground"
          }
        />
      </div>
    </section>
  );
}
