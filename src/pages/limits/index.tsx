import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import {
  FAQAccordion,
  NonHomeHeader,
  SectionHeader,
  TaskLedger,
} from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSettings } from "@/contexts";
import {
  useClaimCampaignUsdc,
  useHasUnclaimedCampaignRewards,
  useOnChainActivityRp,
  useSocialVerificationStatus,
  useTaskLedger,
  useTxLimits,
  useUserOrderVolume,
  useVolumeMilestones,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
import { Verifications } from "./verifications";

export function Limits() {
  const { t } = useTranslation();
  const { txLimit } = useTxLimits();

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
    isZkPassportVerified,
  } = useSocialVerificationStatus();

  // Check if any social is verified
  const isAnySocialVerified =
    !!isLinkedInVerified ||
    !!isGitHubVerified ||
    !!isXVerified ||
    !!isInstagramVerified ||
    !!isFacebookVerified ||
    !!isZkPassportVerified;

  const { settings } = useSettings();

  // Campaign USDC claim hook
  const { claimCampaignUsdcReward, claimCampaignUsdcMutation } =
    useClaimCampaignUsdc();

  // Format reward amount (USDC, 6 decimals)
  const formattedReward =
    rewardAmount && rewardAmount > 0n
      ? Number(formatUnits(rewardAmount, 6))
      : 0;

  return (
    <>
      <NonHomeHeader title={t("MY_LIMITS")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-2 overflow-y-auto">
        <section className="flex w-full flex-col gap-4 py-2">
          <Card className="w-full border-none bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-center font-medium text-lg">
                {t("PER_TRANSACTION_LIMITS")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="flex w-full items-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 p-3">
                  <ASSETS.ICONS.Buy className="size-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t("BUY")}</p>
                  <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                    ${truncateAmount(txLimit?.buyLimit ?? 0, 0)}{" "}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 p-3">
                  <ASSETS.ICONS.Sell className="size-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {t("SELL")}/{t("PAY")}
                  </p>
                  <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                    ${truncateAmount(txLimit?.sellLimit ?? 0, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        {hasUnclaimedRewards && formattedReward > 0 && (
          <section className="flex w-full flex-col gap-4 py-2">
            <div className="flex w-full flex-row items-center justify-between rounded-xl border-none bg-primary/10 p-4 shadow-none">
              <div className="flex h-full w-full flex-col items-start justify-between">
                <p className="font-medium">{t("REFERRAL_BONUS_WAITING")}</p>
                <p className="font-light text-sm">
                  {t("VERIFY_SOCIALS_TO_UNLOCK")}
                </p>
              </div>
              <div className="flex h-full w-full flex-col items-end justify-between gap-2">
                <div className="flex w-full flex-col items-end justify-between gap-2">
                  <p className="text-xs">{t("CLAIM_REWARD")}</p>
                  <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                    ${isCampaignRewardLoading ? "..." : formattedReward}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-primary bg-transparent text-primary"
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

        {!isAnySocialVerified && (
          <section className="flex w-full flex-col gap-4 py-2">
            <Card className="w-full border-none bg-primary/10 shadow-none">
              <CardHeader>
                <p className="font-medium">
                  {t("VERIFY_ATLEAST_ONE_SOCIAL_ACCOUNT")}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-light text-sm">
                  {settings.currency.country === "India"
                    ? t("VERIFY_SOCIAL_TO_GROW_LIMITS_AND_AADHAAR")
                    : t("VERIFY_SOCIAL_TO_GROW_LIMITS")}
                </p>
                <p className="mt-4 mb-2 font-light text-xs">
                  {t("VERIFIED_SOCIALS_TO_UNLOCK")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary px-4 py-0.5 font-medium text-white text-xs">
                    0/1
                  </span>
                  <Progress
                    value={0}
                    className="h-4 flex-1 bg-white"
                    style={{ backgroundColor: "#fff" }}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        {isAnySocialVerified && (
          <section className="flex w-full flex-col gap-4 py-2">
            <div className="flex w-full flex-row items-center justify-between rounded-xl border-none bg-primary/10 p-4 shadow-none">
              <div className="flex h-full w-2/3 flex-col items-start justify-between">
                <p className="font-medium">{t("TOTAL_ORDER_VOLUME")}</p>
                <div className="w-full">
                  {isUserOrderVolumeLoading ||
                  isTaskLedgerLoading ||
                  isMilestonesLoading ? (
                    <Progress
                      value={0}
                      className="h-4 bg-white [&>div]:rounded-full [&>div]:shadow-lg [&>div]:shadow-primary-shadow"
                    />
                  ) : isUserOrderVolumeError ||
                    isTaskLedgerError ||
                    isMilestonesError ? (
                    <div className="text-red-500 text-xs">
                      {t("ERROR_LOADING_PROGRESS")}
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
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
                      </div>
                      <Progress
                        value={(() => {
                          const target = getTarget();
                          return target ? (totalVolume / target) * 100 : 100;
                        })()}
                        className="h-4 bg-white [&>div]:rounded-full [&>div]:shadow-lg [&>div]:shadow-primary-shadow"
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-full w-1/3 flex-col items-end justify-between gap-2">
                <div className="flex w-full flex-col items-end justify-between gap-2">
                  <p className="text-xs">{t("NEXT_LIMIT_UNLOCK")}</p>
                  {isOnChainActivityRpLoading ? (
                    <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent opacity-50">
                      ...
                    </p>
                  ) : isOnChainActivityRpError ? (
                    <p className="text-red-500 text-xs">{t("ERROR")}</p>
                  ) : (
                    <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                      +${onChainActivityRp}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="flex w-full flex-col gap-4 py-2">
          <Verifications />
        </section>
        <section className="flex w-full flex-col gap-4 py-2">
          <TaskLedger />
        </section>
        <section className="flex w-full flex-col justify-between gap-4 py-2">
          <SectionHeader title={t("FAQS")} seeAllLink={INTERNAL_HREFS.HELP} />
          <FAQAccordion faqs={getPageFAQs("LIMITS_PAGE")} />
        </section>
      </main>
    </>
  );
}
