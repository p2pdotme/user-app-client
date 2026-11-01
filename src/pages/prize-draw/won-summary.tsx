import type { LucideIcon } from "lucide-react";
import { Sparkles, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CampaignDetails,
  UserPrizeSummary,
} from "@/core/prizerail/user-api";
import { formatPrizeCents } from "@/lib/prizerail";
import { WonSummarySkeleton } from "./skeletons";
import { TICKET_STUB, TICKET_SURFACE, TicketNotches } from "./ticket";

interface WonSummaryProps {
  wins: UserPrizeSummary["wins"] | undefined;
  isLoading: boolean;
  /** Campaign-wide totals; undefined while loading or when unavailable. */
  stats: CampaignDetails["stats"] | undefined;
  isStatsLoading: boolean;
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** One figure on the stub. */
function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-[11px] text-muted-foreground leading-tight">
          {label}
        </p>
        <p className="truncate font-semibold text-base text-foreground tabular-nums leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className="size-8 shrink-0 rounded-full bg-background/70" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-2.5 w-20 bg-background/70" />
        <Skeleton className="h-4 w-14 bg-background/70" />
      </div>
    </div>
  );
}

/**
 * Totals over every participant on the ticket stub, so a reader sees the
 * draw is live and paying. Left out until a prize has been paid, and when
 * the campaign cannot be read.
 */
function CampaignStub({
  stats,
  isLoading,
}: {
  stats: CampaignDetails["stats"] | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  if (!isLoading && (!stats || stats.winnersCount <= 0)) return null;

  return (
    <div className={TICKET_STUB}>
      <TicketNotches />
      {isLoading || !stats ? (
        <>
          <StatSkeleton />
          <StatSkeleton />
        </>
      ) : (
        <>
          <Stat
            icon={Trophy}
            label={t("PRIZERAIL_PRIZES_TOTAL_PAID")}
            value={formatPrizeCents(stats.totalPrizesCents)}
          />
          <Stat
            icon={Users}
            label={t("PRIZERAIL_PRIZES_WINNERS")}
            value={stats.winnersCount.toLocaleString()}
          />
        </>
      )}
    </div>
  );
}

/**
 * Ticket-shaped banner at the top of the page: what the wallet has won on
 * the body, the campaign's totals on the stub. Styled with the theme's
 * tokens only, so it matches the homescreen cards in both colour modes.
 */
export function WonSummary({
  wins,
  isLoading,
  stats,
  isStatsLoading,
}: WonSummaryProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <WonSummarySkeleton />;
  }
  if (!wins) return null;

  const hasWins = wins.count > 0;

  return (
    <section className={TICKET_SURFACE}>
      {/* Trophy watermark behind the body */}
      <Trophy
        className="-bottom-5 pointer-events-none absolute left-28 size-28 rotate-12 text-primary opacity-[0.06]"
        strokeWidth={1.5}
        aria-hidden="true"
      />

      <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-1 p-5">
        <p className="flex items-center gap-1.5 font-semibold text-[11px] text-primary uppercase tracking-[0.3em]">
          <Sparkles className="size-3.5" />
          {t("PRIZERAIL_TOTAL_WON")}
        </p>
        <p className="truncate bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-4xl text-transparent tabular-nums tracking-tight">
          {formatPrizeCents(wins.totalCents)}
        </p>
        {hasWins && (
          <p className="text-muted-foreground text-sm">
            {t(
              wins.count === 1
                ? "PRIZERAIL_WON_IN_DRAW"
                : "PRIZERAIL_WON_IN_DRAWS",
              { count: wins.count },
            )}
          </p>
        )}
      </div>

      <CampaignStub stats={stats} isLoading={isStatsLoading} />
    </section>
  );
}
