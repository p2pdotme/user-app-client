import {
  ChevronRight,
  Coins,
  type LucideIcon,
  ScanFace,
  ShieldCheck,
  SmilePlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSettings } from "@/contexts";
import { useUserStake } from "@/hooks";
import { INTERNAL_HREFS, LIVENESS_EXCLUDED_COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BadgeTone = "green" | "blue" | "amber" | "rose";

/** Distinct pill colors so each method's hint is recognisable at a glance. */
const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  blue: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

interface MethodCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  /** Short hint pill shown under the title, e.g. "Fastest". */
  badge: string;
  badgeTone: BadgeTone;
  onClick: () => void;
}

function MethodCard({
  Icon,
  title,
  description,
  badge,
  badgeTone,
  onClick,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
        <Icon className="size-6 text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-bold text-base text-foreground leading-[22px]">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold text-[11px] leading-4",
              BADGE_TONE_CLASSES[badgeTone],
            )}>
            {badge}
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-[18px]">
          {description}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** The "ways to increase limits" list on /limits. */
export function IncreaseLimitMethods() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Liveness is offered in every market except the excluded ones.
  const isLivenessOffered = !LIVENESS_EXCLUDED_COUNTRIES.includes(
    settings.currency.country,
  );

  // Same routing rule as the stake CTA: an existing stake opens "My stake".
  const { userStake } = useUserStake();
  const hasActiveStake =
    userStake !== undefined &&
    userStake !== null &&
    userStake.stakedAmount > 0n;
  const stakeRoute = hasActiveStake
    ? INTERNAL_HREFS.P2P_TOKEN_MY_STAKE
    : INTERNAL_HREFS.P2P_TOKEN_STAKE;

  return (
    <div className="flex flex-col gap-3">
      {/* Liveness leads the list: fastest path, no document. Not offered in
          excluded markets (India), which run passport only. */}
      {isLivenessOffered && (
        <MethodCard
          Icon={SmilePlus}
          title={t("METHOD_LIVENESS_TITLE")}
          badge={t("METHOD_BADGE_FASTEST")}
          badgeTone="green"
          description={t("METHOD_LIVENESS_DESCRIPTION")}
          onClick={() => navigate(INTERNAL_HREFS.LIMITS_LIVENESS)}
        />
      )}
      <MethodCard
        Icon={ScanFace}
        title={t("METHOD_PASSPORT_TITLE")}
        badge={t("METHOD_BADGE_QUICK")}
        badgeTone="blue"
        description={t("METHOD_PASSPORT_DESCRIPTION")}
        onClick={() => navigate(INTERNAL_HREFS.LIMITS_PASSPORT)}
      />
      <MethodCard
        Icon={Coins}
        title={t("METHOD_STAKE_TITLE")}
        badge={t("METHOD_BADGE_INSTANT")}
        badgeTone="amber"
        description={t("METHOD_STAKE_DESCRIPTION")}
        onClick={() => navigate(stakeRoute)}
      />
      <MethodCard
        Icon={ShieldCheck}
        title={t("METHOD_ZK_KYC_TITLE")}
        badge={t("METHOD_BADGE_NEEDS_PATIENCE")}
        badgeTone="rose"
        description={t("METHOD_ZK_KYC_DESCRIPTION")}
        onClick={() => navigate(INTERNAL_HREFS.LIMITS_ZK_KYC)}
      />
    </div>
  );
}
