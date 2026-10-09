import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { formatUnits } from "viem";
import {
  FAQAccordion,
  NonHomeHeader,
  SectionHeader,
  TaskLedger,
} from "@/components";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useClaimCampaignUsdc,
  useHasUnclaimedCampaignRewards,
  useMaxBuyTxLimit,
  useMaxSellTxLimit,
  useOnChainActivityRp,
  usePageMeta,
  useSocialVerificationStatus,
  useTaskLedger,
  useTxLimits,
  useUserOrderVolume,
  useVolumeMilestones,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { getStoredParams } from "@/lib/url-param-preservation";
import { truncateAmount } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
import { IncreaseLimitMethods } from "./method-cards";
import { VerifySocialCta } from "./verifications";

// Truncate (floor) to whole units and format with locale grouping.
function formatLimit(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return Math.floor(value).toLocaleString();
}

interface LimitCardProps {
  label: string;
  rawValue: number;
  maxLimit: number;
  progress: number;
  loading?: boolean;
  loadingMax?: boolean;
}

function LimitCard({
  label,
  rawValue,
  maxLimit,
  progress,
  loading,
  loadingMax,
}: LimitCardProps) {
  const { t } = useTranslation();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl bg-primary/5 p-4">
      <p className="font-semibold text-[11px] text-muted-foreground uppercase leading-none tracking-[1px]">
        {label}
      </p>

      <div className="flex flex-col gap-0.5">
        {loading ? (
          <Skeleton className="my-1 h-7 w-28 rounded-md" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <p className="font-bold text-[22px] text-foreground tabular-nums leading-[28px]">
              {formatLimit(rawValue)}
            </p>
            <p className="font-semibold text-[11px] text-muted-foreground leading-none tracking-wide">
              USDC
            </p>
          </div>
        )}
        <p className="font-bold text-[12px] text-foreground tabular-nums leading-4">
          {loadingMax ? (
            <Skeleton className="inline-block h-3.5 w-20 rounded-md align-middle" />
          ) : (
            t("LIMIT_CARD_MAX_USDC", { amount: formatLimit(maxLimit) })
          )}
        </p>
      </div>

      <div className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width] duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Hosted wizards (Reclaim, simple-kyc, liveness) all return to `/limits`.
 * The cards that redeem those callbacks now live on the sub-pages, so forward
 * the callback there with its query string intact.
 */
function useForwardVerificationCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const state = params.get("state") ?? "";
    const hasCode = params.has("code");
    const stored = getStoredParams();
    const hasReclaimSession =
      (params.has("sessionId") && params.has("socialPlatform")) ||
      Boolean(stored?.sessionId && stored?.socialPlatform);

    let target: string | null = null;
    if (hasCode && state.startsWith("kyc")) {
      target = INTERNAL_HREFS.LIMITS_PASSPORT;
    } else if (hasCode && state.startsWith("liveness")) {
      target = INTERNAL_HREFS.LIMITS_LIVENESS;
    } else if (hasReclaimSession) {
      target = INTERNAL_HREFS.LIMITS_ZK_KYC;
    }

    if (target) {
      navigate(
        { pathname: target, search: location.search },
        { replace: true },
      );
    }
  }, [location.search, navigate]);
}

export function Limits() {
  const { t } = useTranslation();
  usePageMeta({ title: t("MY_LIMITS") });
  const navigate = useNavigate();
  useForwardVerificationCallback();

  const { txLimit, isTxLimitLoading } = useTxLimits();
  const { maxBuyTxLimit, isMaxBuyTxLimitLoading } = useMaxBuyTxLimit();
  const { maxSellTxLimit, isMaxSellTxLimitLoading } = useMaxSellTxLimit();

  const { milestones, isMilestonesLoading, isMilestonesError } =
    useVolumeMilestones();

  const {
    totalVolume = 0,
    isUserOrderVolumeLoading,
    isUserOrderVolumeError,
  } = useUserOrderVolume();

  const {
    onChainActivityRp = 0,
    isOnChainActivityRpLoading,
    isOnChainActivityRpError,
  } = useOnChainActivityRp();

  const {
    taskLedger: taskLedgerData,
    isTaskLedgerLoading,
    isTaskLedgerError,
  } = useTaskLedger();

  // Helper function to safely format totalVolume with 0 precision
  // When totalVolume < 1, returns 0 instead of causing maximumSignificantDigits error
  const formatTotalVolume = (volume: number): number => {
    if (volume < 1 && volume > 0) {
      return 0;
    }
    return truncateAmount(volume, 0);
  };

  function getTarget() {
    // Don't use any hardcoded values - return null if milestones aren't loaded yet
    if (milestones.length === 0) {
      return null;
    }

    // Count how many completed transactions (taskType 1) the user has
    const completedTransactions =
      taskLedgerData?.filter((task) => task.taskType === 1).length || 0;

    // Calculate how many milestones the user has already achieved based on transactions
    const achievedMilestones = Math.min(
      completedTransactions,
      milestones.length,
    );

    // Check if current volume has crossed any additional milestones beyond what's recorded in task ledger
    let currentMilestoneIndex = achievedMilestones;

    // Find the highest milestone the current volume has reached
    for (let i = achievedMilestones; i < milestones.length; i++) {
      if (totalVolume >= milestones[i]) {
        currentMilestoneIndex = i + 1; // Move to next milestone
      } else {
        break;
      }
    }

    // If user has achieved all milestones, return null to indicate max reached
    if (currentMilestoneIndex >= milestones.length) {
      return null;
    }

    // Return the next milestone they're working toward
    return milestones[currentMilestoneIndex];
  }

  // Referral Bonus Waiting Card logic
  const {
    hasUnclaimedRewards,
    isLoading: isCampaignRewardLoading,
    rewardAmount,
  } = useHasUnclaimedCampaignRewards();

  // Social verification status
  const {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
  } = useSocialVerificationStatus();

  // Check if any social is verified
  const isAnySocialVerified =
    !!isLinkedInVerified ||
    !!isGitHubVerified ||
    !!isXVerified ||
    !!isInstagramVerified ||
    !!isFacebookVerified;

  // Campaign USDC claim hook
  const { claimCampaignUsdcReward, claimCampaignUsdcMutation } =
    useClaimCampaignUsdc();

  // Format reward amount (USDC, 6 decimals)
  const formattedReward =
    rewardAmount && rewardAmount > 0n
      ? Number(formatUnits(rewardAmount, 6))
      : 0;

  const buyValue = txLimit?.buyLimit ?? 0;
  const sellValue = txLimit?.sellLimit ?? 0;
  // On-chain limits are uint256 in USDC base units (6 decimals).
  const maxBuy =
    maxBuyTxLimit !== undefined
      ? Number(formatUnits(maxBuyTxLimit as bigint, 6))
      : 0;
  const maxSell =
    maxSellTxLimit !== undefined
      ? Number(formatUnits(maxSellTxLimit as bigint, 6))
      : 0;
  const buyProgress = maxBuy > 0 ? (buyValue / maxBuy) * 100 : 0;
  const sellProgress = maxSell > 0 ? (sellValue / maxSell) * 100 : 0;

  return (
    <>
      <NonHomeHeader
        title={t("INCREASE_LIMITS")}
        subtitle={t("INCREASE_LIMITS_SUBTITLE")}
        onBack={() => navigate(INTERNAL_HREFS.HOME)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-8 overflow-y-auto pt-8 pb-4">
        {/* Per-transaction limits */}
        <section className="flex flex-col gap-4">
          <p className="font-semibold text-muted-foreground text-xs uppercase leading-4 tracking-[1px]">
            {t("PER_TRANSACTION_LIMITS")}
          </p>
          <div className="flex items-stretch gap-4">
            <LimitCard
              label={t("BUY")}
              rawValue={buyValue}
              maxLimit={maxBuy}
              progress={buyProgress}
              loading={isTxLimitLoading}
              loadingMax={isMaxBuyTxLimitLoading}
            />
            <LimitCard
              label={`${t("SELL")}/${t("PAY")}`}
              rawValue={sellValue}
              maxLimit={maxSell}
              progress={sellProgress}
              loading={isTxLimitLoading}
              loadingMax={isMaxSellTxLimitLoading}
            />
          </div>
        </section>

        {/* Referral Bonus Waiting */}
        {hasUnclaimedRewards && formattedReward > 0 && (
          <section className="flex w-full flex-col">
            <div className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="font-bold text-base text-foreground leading-[22px]">
                  {t("REFERRAL_BONUS_WAITING")}
                </p>
                <p className="font-medium text-foreground text-sm leading-[19px]">
                  {t("VERIFY_SOCIALS_TO_UNLOCK")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-4">
                <div className="flex flex-col items-end gap-1">
                  <p className="font-medium text-foreground text-xs leading-none">
                    {t("CLAIM_REWARD")}
                  </p>
                  <p className="font-bold text-3xl text-primary tabular-nums leading-none">
                    ${isCampaignRewardLoading ? "…" : formattedReward}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-full border-2 border-primary bg-transparent px-6 font-semibold text-primary text-sm hover:bg-primary/5"
                  disabled={
                    claimCampaignUsdcMutation.isPending ||
                    isCampaignRewardLoading
                  }
                  onClick={claimCampaignUsdcReward}>
                  {claimCampaignUsdcMutation.isPending
                    ? t("CLAIMING")
                    : t("CLAIM_REWARD")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Total order volume → next limit unlock */}
        {isAnySocialVerified && (
          <section className="flex w-full flex-col">
            <div className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-bold text-base text-foreground leading-[22px]">
                  {t("TOTAL_ORDER_VOLUME")}
                </p>
                {isUserOrderVolumeLoading ||
                isTaskLedgerLoading ||
                isMilestonesLoading ? (
                  <Progress value={0} className="h-1.5 bg-muted" />
                ) : isUserOrderVolumeError ||
                  isTaskLedgerError ||
                  isMilestonesError ? (
                  <p className="text-red-500 text-xs">
                    {t("ERROR_LOADING_PROGRESS")}
                  </p>
                ) : (
                  <>
                    <p className="font-medium text-muted-foreground text-xs tabular-nums leading-4">
                      {getTarget() ? (
                        <>
                          ${formatTotalVolume(totalVolume)} / ${getTarget()}
                        </>
                      ) : (
                        <>
                          ${formatTotalVolume(totalVolume)} -{" "}
                          {t("ALL_MILESTONES_ACHIEVED")}
                        </>
                      )}
                    </p>
                    <Progress
                      value={(() => {
                        const target = getTarget();
                        return target ? (totalVolume / target) * 100 : 100;
                      })()}
                      className="h-1.5 bg-muted"
                    />
                  </>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-medium text-foreground text-xs leading-none">
                  {t("NEXT_LIMIT_UNLOCK")}
                </p>
                {isOnChainActivityRpLoading ? (
                  <p className="font-bold text-3xl text-primary leading-none opacity-50">
                    …
                  </p>
                ) : isOnChainActivityRpError ? (
                  <p className="text-red-500 text-xs">{t("ERROR")}</p>
                ) : (
                  <p className="font-bold text-3xl text-primary tabular-nums leading-none">
                    +${onChainActivityRp}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Ways to increase limits */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-semibold text-foreground text-lg leading-7">
              {t("INCREASE_LIMITS_WAYS_TITLE")}
            </h2>
            <p className="text-muted-foreground text-sm leading-[19px]">
              {t("INCREASE_LIMITS_WAYS_DESCRIPTION")}
            </p>
          </div>

          <div className="flex flex-col rounded-2xl bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="size-[18px] text-primary" />
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="font-semibold text-foreground text-sm leading-5">
                  {t("ZK_PRIVACY_BANNER_TITLE")}
                </p>
                <p className="text-[13px] text-muted-foreground leading-[18px]">
                  {t("VERIFY_SECURELY_DESCRIPTION")}
                </p>
              </div>
            </div>
            <VerifySocialCta />
          </div>

          <IncreaseLimitMethods />
        </section>

        {/* Limit updates */}
        <section className="flex flex-col">
          <TaskLedger />
        </section>

        <section className="flex w-full flex-col justify-between gap-4">
          <SectionHeader title={t("FAQS")} seeAllLink={INTERNAL_HREFS.HELP} />
          <FAQAccordion faqs={getPageFAQs("LIMITS_PAGE")} slice={4} />
        </section>
      </main>
    </>
  );
}
