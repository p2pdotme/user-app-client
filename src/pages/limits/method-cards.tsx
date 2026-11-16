import { usePrices } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Coins,
  type LucideIcon,
  ScanFace,
  ShieldCheck,
  SmilePlus,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSettings } from "@/contexts";
import { useAnalytics, useUserStake } from "@/hooks";
import {
  useKycRpReward,
  useKycVerificationStatus,
  useLivenessRpReward,
  useLivenessVerificationStatus,
  useSocialRpRewards,
} from "@/hooks/use-tx-limits";
import { EVENTS } from "@/lib/analytics";
import {
  INTERNAL_HREFS,
  KYC_COUNTRY_BY_CURRENCY,
  LIVENESS_EXCLUDED_COUNTRIES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type BadgeTone = "green" | "blue" | "amber" | "rose" | "muted";

/** Distinct pill colors so each method's hint is recognisable at a glance. */
const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  blue: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  muted: "bg-muted text-muted-foreground",
};

type MethodId = "liveness" | "passport" | "stake" | "zk_kyc";

/**
 * USDC of per-order limit granted per reputation point in the user's market.
 * Same query (and cache key) the verification rows on the sub-pages use, so
 * the number on the card matches the number on the row it leads to.
 */
export function useRpToUsdcMultiplier(): number | undefined {
  const { settings } = useSettings();
  const prices = usePrices();
  const { data } = useQuery({
    queryKey: ["rp-per-usdt-limit", settings.currency.currency],
    queryFn: async () =>
      prices
        .getReputationPerUsdcLimit({ currency: settings.currency.currency })
        .match(
          (value) => value.multiplier,
          // Don't fall back to 1: that showed raw reputation points as if
          // they were USDC. Unknown -> the gain label is simply hidden.
          (error) => {
            throw error;
          },
        ),
  });
  return data;
}

interface MethodCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  /** Short hint pill shown under the title, e.g. "Fastest". */
  badge: string;
  badgeTone: BadgeTone;
  /** What the user gains, e.g. "+500 USDC per order". */
  gain?: string;
  /** Already completed: shows a check instead of the gain line. */
  isDone?: boolean;
  /** Shown greyed out and not tappable, with `unavailableReason`. */
  unavailableReason?: string;
  onClick: () => void;
}

function MethodCard({
  Icon,
  title,
  description,
  badge,
  badgeTone,
  gain,
  isDone,
  unavailableReason,
  onClick,
}: MethodCardProps) {
  const { t } = useTranslation();
  const isUnavailable = Boolean(unavailableReason);
  return (
    <button
      type="button"
      onClick={isUnavailable ? undefined : onClick}
      disabled={isUnavailable}
      aria-disabled={isUnavailable}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors",
        isUnavailable
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-primary/40 hover:bg-primary/5",
      )}>
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
              BADGE_TONE_CLASSES[isUnavailable ? "muted" : badgeTone],
            )}>
            {isUnavailable ? t("LIM_METHOD_UNAVAILABLE_BADGE") : badge}
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-[18px]">
          {unavailableReason ?? description}
        </p>
        {!isUnavailable &&
          (isDone ? (
            <p className="flex items-center gap-1 font-semibold text-emerald-600 text-xs leading-4 dark:text-emerald-400">
              <Check className="size-3.5" />
              {t("LIM_METHOD_DONE")}
            </p>
          ) : gain ? (
            <p className="font-semibold text-primary text-xs leading-4">
              {gain}
            </p>
          ) : null)}
      </div>
      {!isUnavailable && (
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

/** The "ways to increase limits" list on /limits. */
export function IncreaseLimitMethods() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { track } = useAnalytics();

  // Liveness is offered in every market except the excluded ones.
  const isLivenessOffered = !LIVENESS_EXCLUDED_COUNTRIES.includes(
    settings.currency.country,
  );
  // Passport KYC needs a supported passport country for the selected market
  // (same gate as /limits/passport). Decided here so users don't tap into a
  // "not available in your region" dead end.
  const isPassportOffered = Boolean(
    KYC_COUNTRY_BY_CURRENCY[settings.currency.currency],
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

  // Limit gain per method: reputation reward × the market's RP→USDC rate.
  const multiplier = useRpToUsdcMultiplier();
  const { livenessRp } = useLivenessRpReward();
  const { kycRp } = useKycRpReward();
  const { linkedInRp, gitHubRp, instagramRp, xRp, facebookRp, binanceRp } =
    useSocialRpRewards();
  const { isLivenessVerified } = useLivenessVerificationStatus();
  const { isKycVerified } = useKycVerificationStatus();

  const toUsdc = (rp: number | undefined) =>
    multiplier && rp && rp > 0 ? Math.floor(rp * multiplier) : 0;
  const formatGain = (usdc: number) =>
    usdc > 0
      ? t("LIM_METHOD_GAIN", { amount: usdc.toLocaleString() })
      : t("LIM_METHOD_GAIN_GENERIC");
  const bestSocialUsdc = Math.max(
    0,
    ...[linkedInRp, gitHubRp, instagramRp, xRp, facebookRp, binanceRp].map(
      toUsdc,
    ),
  );

  const openMethod = (method: MethodId, route: string) => {
    track(EVENTS.VERIFICATION, {
      status: "method_card_tapped",
      method,
      currency: settings.currency.currency,
    });
    navigate(route);
  };

  const trackedUnavailable = useRef<string | null>(null);
  useEffect(() => {
    if (isPassportOffered) return;
    const key = settings.currency.currency;
    if (trackedUnavailable.current === key) return;
    trackedUnavailable.current = key;
    track(EVENTS.VERIFICATION, {
      status: "method_unavailable_shown",
      method: "passport",
      currency: key,
    });
  }, [isPassportOffered, settings.currency.currency, track]);

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
          gain={formatGain(toUsdc(livenessRp))}
          isDone={!!isLivenessVerified}
          onClick={() => openMethod("liveness", INTERNAL_HREFS.LIMITS_LIVENESS)}
        />
      )}
      {isPassportOffered && (
        <MethodCard
          Icon={ScanFace}
          title={t("METHOD_PASSPORT_TITLE")}
          badge={t("METHOD_BADGE_QUICK")}
          badgeTone="blue"
          description={t("METHOD_PASSPORT_DESCRIPTION")}
          gain={formatGain(toUsdc(kycRp))}
          isDone={!!isKycVerified}
          onClick={() => openMethod("passport", INTERNAL_HREFS.LIMITS_PASSPORT)}
        />
      )}
      <MethodCard
        Icon={Coins}
        title={t("METHOD_STAKE_TITLE")}
        badge={t("METHOD_BADGE_INSTANT")}
        badgeTone="amber"
        description={t("METHOD_STAKE_DESCRIPTION")}
        gain={t("LIM_METHOD_GAIN_STAKE")}
        onClick={() => openMethod("stake", stakeRoute)}
      />
      <MethodCard
        Icon={ShieldCheck}
        title={t("LIM_METHOD_ZK_TITLE")}
        badge={t("LIM_METHOD_BADGE_TAKES_MINUTES")}
        badgeTone="rose"
        description={t("LIM_METHOD_ZK_DESCRIPTION")}
        gain={
          bestSocialUsdc > 0
            ? t("LIM_METHOD_GAIN_PER_ACCOUNT", {
                amount: bestSocialUsdc.toLocaleString(),
              })
            : t("LIM_METHOD_GAIN_GENERIC")
        }
        onClick={() => openMethod("zk_kyc", INTERNAL_HREFS.LIMITS_ZK_KYC)}
      />
      {/* Unavailable methods go last, greyed out, so users who heard about
          them learn why they can't use them without tapping into a dead end. */}
      {!isPassportOffered && (
        <MethodCard
          Icon={ScanFace}
          title={t("METHOD_PASSPORT_TITLE")}
          badge={t("METHOD_BADGE_QUICK")}
          badgeTone="blue"
          description={t("METHOD_PASSPORT_DESCRIPTION")}
          unavailableReason={t("LIMITS_UNAVAILABLE_IN_REGION_DESCRIPTION")}
          onClick={() => {}}
        />
      )}
    </div>
  );
}
