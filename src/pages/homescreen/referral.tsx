import {
  ArrowRight,
  Copy,
  HandCoins,
  LinkIcon,
  Share,
  Share2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { GaugeProgress } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useClaimRecommendationRevenue,
  useCmVotesPerEpoch,
  useCurrentMonthRecommendationsGiven,
  useIsCommunityManager,
  useRecommenderReward,
  useRecommenderRewardPercentage,
  useReferralLink,
  useThirdweb,
  useTxLimits,
  useUserRp,
  useVotesPerEpoch,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
// import { useSettings } from "@/contexts";

export function Referral() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  // const {
  //   settings: { currency },
  // } = useSettings();
  const { txLimit } = useTxLimits();
  const { userRp, isUserRpLoading } = useUserRp();
  const { recommendationsGiven } = useCurrentMonthRecommendationsGiven();
  const { recommenderReward, isPending: isRecommenderRewardPending } =
    useRecommenderReward();
  const { rewardPercentage, isPending: isRewardPercentagePending } =
    useRecommenderRewardPercentage();
  const { mutateAsync: claimRecommendationRevenue, isPending: isClaiming } =
    useClaimRecommendationRevenue();

  const {
    generateLink,
    shareUrl,
    isPending,
    copyReferralLink,
    shareReferralLink,
  } = useReferralLink(userRp, account?.address || "");

  // Fetch dynamic max recommendations
  const { votesPerEpoch } = useVotesPerEpoch();
  const { cmVotesPerEpoch } = useCmVotesPerEpoch();
  const { isCommunityManager } = useIsCommunityManager();

  const maxRecommendations = isCommunityManager
    ? cmVotesPerEpoch
    : votesPerEpoch;

  const isZkProofRequired = txLimit?.buyLimit === 10;
  const rpTarget = 150;

  const handleCopyReferralLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    copyReferralLink();
  };

  const handleShareReferralLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    shareReferralLink();
  };

  const handleGenerateLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    generateLink();
  };

  const handleClaimReward = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (recommenderReward === 0) {
      toast.info(t("NO_REWARDS_TO_CLAIM"));
      return;
    }

    // Use "INR" as the market parameter (you can change this based on your requirements)
    await claimRecommendationRevenue();
  };

  if (isZkProofRequired) {
    return (
      <Link
        to={INTERNAL_HREFS.LIMITS}
        viewTransition
        className="w-full"
        style={{
          viewTransitionName: "referral",
        }}>
        <Card className="relative w-full border-none bg-primary/5">
          <CardHeader>
            <CardTitle>{t("REFER_AND_EARN")}</CardTitle>
            <CardDescription>
              {t("REFER_AND_EARN_DESCRIPTION_NON_EARNABLE", {
                referralRewardPercentage: isRewardPercentagePending
                  ? "..."
                  : rewardPercentage,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="mx-6 flex flex-col items-start justify-center gap-4 rounded-xl bg-primary/10 p-6">
            <p className="text-start font-regular text-foreground text-sm">
              {t("COMPLETE_ZK_PROOF_TO_UNLOCK")}
            </p>
            <Button variant="outline">{t("VERIFY_ZK_PROOF")}</Button>
          </CardContent>
        </Card>
      </Link>
    );
  } else if (!isUserRpLoading) {
    const isEarnable = userRp >= rpTarget;
    if (!isEarnable) {
      const leftToTarget = rpTarget - userRp;
      const progress = Math.min((userRp / rpTarget) * 100, 100);
      return (
        <Link
          to={INTERNAL_HREFS.LIMITS}
          viewTransition
          className="w-full"
          style={{
            viewTransitionName: "referral",
          }}>
          <Card className="relative w-full border-none bg-primary/5">
            <CardHeader className="flex items-start justify-between gap-8">
              <div className="flex flex-col gap-2">
                <CardTitle>{t("REFER_AND_EARN")}</CardTitle>
                <CardDescription>
                  {t("REFER_AND_EARN_DESCRIPTION_NON_EARNABLE", {
                    referralRewardPercentage: isRewardPercentagePending
                      ? "..."
                      : rewardPercentage,
                  })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="mx-6 flex flex-col items-start justify-center gap-4 rounded-xl bg-primary/10 p-6">
              <p className="text-start font-regular text-foreground text-sm">
                {t("REFERRAL_PROGRESS_MESSAGE", {
                  left: leftToTarget,
                  target: rpTarget,
                })}
              </p>

              <div className="w-full">
                <p className="text-start font-regular text-xs">
                  {Math.round(progress)}% {t("DONE")}
                </p>
                <div className="relative w-full">
                  <Progress
                    value={progress}
                    className="h-4 bg-white [&>div]:rounded-full [&>div]:shadow-lg [&>div]:shadow-primary-shadow"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    } else {
      return (
        <Link
          to={INTERNAL_HREFS.REFERRAL}
          viewTransition
          className="w-full"
          style={{
            viewTransitionName: "referral",
          }}>
          <Card className="w-full cursor-pointer border-none bg-primary/5">
            <CardHeader className="flex items-start justify-between gap-8">
              <div className="flex flex-col gap-2">
                <CardTitle>{t("REFER_AND_EARN")}</CardTitle>
                <CardDescription>
                  {t("REFER_AND_EARN_DESCRIPTION_EARNABLE", {
                    referralRewardPercentage: isRewardPercentagePending
                      ? "..."
                      : rewardPercentage,
                  })}
                </CardDescription>
              </div>
              <ArrowRight className="size-8" />
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex flex-col items-center">
                <GaugeProgress
                  numerator={recommendationsGiven.length}
                  denominator={maxRecommendations}
                  size="size-28"
                  label={t("OUT_OF_DENOMINATOR", {
                    denominator: maxRecommendations,
                  })}
                />
                <p className="text-xs">{t("REFERRED")}</p>
              </div>
              <div className="flex flex-col gap-4 rounded-lg bg-background p-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                    <Share2 className="size-3 text-primary" />
                  </div>
                  <p className="text-xs">{t("SHARE_P2P_WITH_FRIENDS")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                    <LinkIcon className="size-3 text-primary" />
                  </div>
                  <p className="text-xs">{t("INVITE_VIA_REFERRAL_LINK")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                    <HandCoins className="size-3 text-primary" />
                  </div>
                  <p className="text-xs">
                    {t("EARN_REFERRAL_BONUS", {
                      referralRewardPercentage: isRewardPercentagePending
                        ? "..."
                        : rewardPercentage,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full border-primary bg-transparent"
                variant="outline"
                onClick={handleGenerateLink}
                disabled={isPending}>
                <p className="text-primary">
                  {isPending
                    ? t("GENERATING_LINK")
                    : t("GENERATE_REFERRAL_LINK")}
                </p>
              </Button>
              {shareUrl && (
                <div className="flex w-full items-center gap-2">
                  <div className="w-4/5 overflow-hidden rounded-lg bg-background p-1">
                    <div className="inline-block whitespace-nowrap">
                      <span className="font-medium text-xs">{shareUrl}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCopyReferralLink}
                    className="border-none bg-background"
                    variant="outline"
                    size="icon">
                    <Copy className="size-4 text-primary" />
                  </Button>
                  <Button
                    onClick={handleShareReferralLink}
                    className="border-none bg-background"
                    variant="outline"
                    size="icon">
                    <Share className="size-4 text-primary" />
                  </Button>
                </div>
              )}
              <div className="flex w-full items-center justify-between gap-4 rounded-xl bg-background p-4 shadow-[0_0_14px_0_var(--primary-shadow)]">
                <div className="flex items-center gap-4">
                  <ASSETS.ICONS.ReferralClaimableBadge className="size-10 text-primary" />
                  <div className="flex flex-col">
                    <p className="text-sm">{t("CLAIMABLE_REWARDS")}</p>
                    <p className="font-bold text-md text-primary">
                      {isRecommenderRewardPending
                        ? "..."
                        : `${recommenderReward} USDC`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClaimReward}
                  disabled={isClaiming || recommenderReward === 0}>
                  <p>{isClaiming ? t("CLAIMING") : t("CLAIM")}</p>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </Link>
      );
    }
  } else {
    return null;
  }
}
