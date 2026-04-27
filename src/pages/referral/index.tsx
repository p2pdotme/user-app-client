import {
  AlertTriangle,
  ArrowRight,
  Copy,
  HandCoins,
  LinkIcon,
  Share,
  Share2,
} from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import {
  FAQAccordion,
  GaugeProgress,
  NonHomeHeader,
  SectionHeader,
} from "@/components";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useClaimRecommendationRevenue,
  useCmVotesPerEpoch,
  useCurrentMonthRecommendationsGiven,
  useIsCommunityManager,
  useRecommendationsGiven,
  useRecommendationsReceived,
  useRecommenderReward,
  useRecommenderRewardPercentage,
  useReferralLink,
  useThirdweb,
  useTxLimits,
  useVotesPerEpoch,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAddress } from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";
// import { useSettings } from "@/contexts";

export function Referral() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { txLimit } = useTxLimits();
  // const {
  //   settings: { currency },
  // } = useSettings();

  const { recommendationsGiven, isPending: isRecommendationsGivenPending } =
    useRecommendationsGiven();
  const { recommendationsGiven: currentMonthRecommendationsGiven } =
    useCurrentMonthRecommendationsGiven();
  const {
    recommendationsReceived,
    isPending: isRecommendationsReceivedPending,
  } = useRecommendationsReceived();
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
  } = useReferralLink(txLimit?.buyLimit || 0, account?.address || "");

  // Fetch dynamic max recommendations
  const { votesPerEpoch } = useVotesPerEpoch();
  const { cmVotesPerEpoch } = useCmVotesPerEpoch();
  const { isCommunityManager } = useIsCommunityManager();

  console.log("votesPerEpoch", votesPerEpoch);
  console.log("cmVotesPerEpoch", cmVotesPerEpoch);
  console.log("isCommunityManager", isCommunityManager);

  const maxRecommendations = isCommunityManager
    ? cmVotesPerEpoch
    : votesPerEpoch;

  const handleClaimReward = async () => {
    if (recommenderReward === 0) {
      toast.info(t("NO_REWARDS_TO_CLAIM"));
      return;
    }

    // Use "INR" as the market parameter (you can change this based on your requirements)
    await claimRecommendationRevenue();
  };

  return (
    <>
      <NonHomeHeader title={t("REFER_AND_EARN")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-6 overflow-y-auto">
        <section className="flex w-full items-center justify-between pt-6">
          {txLimit?.buyLimit && txLimit.buyLimit < 100 && (
            <Alert variant="warning" className="w-full py-2">
              <AlertTriangle className="size-4" />
              <AlertDescription className="flex w-full items-center justify-between text-xs">
                <p className="text-foreground">
                  <Trans i18nKey="INCREASE_LIMITS_TO_START_EARNING">
                    <span className="font-semibold">$150</span>
                  </Trans>
                </p>
                <Link
                  to={INTERNAL_HREFS.LIMITS}
                  className="flex items-center font-semibold text-foreground">
                  {t("INCREASE_LIMITS")}
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </section>
        <h1 className="w-3/4 font-medium text-2xl">
          {t("REFER_YOUR_FRIENDS")} &amp;{" "}
          {t("EARN_REFERRAL_BONUS", {
            referralRewardPercentage: isRewardPercentagePending
              ? "..."
              : rewardPercentage,
          })}
        </h1>
        <section className="flex w-full items-center justify-between gap-4 py-2">
          <div className="flex flex-col items-center">
            <GaugeProgress
              numerator={currentMonthRecommendationsGiven.length}
              denominator={maxRecommendations}
              size="size-32"
              label={t("OUT_OF_DENOMINATOR", {
                denominator: maxRecommendations,
              })}
            />
            <p className="text-xs">{t("REFERRED")}</p>
          </div>
          <div className="flex flex-col gap-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                <Share2 className="size-3 text-primary" />
              </div>
              <p className="text-sm">{t("SHARE_P2P_WITH_FRIENDS")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                <LinkIcon className="size-3 text-primary" />
              </div>
              <p className="text-sm">{t("INVITE_VIA_REFERRAL_LINK")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 p-1">
                <HandCoins className="size-3 text-primary" />
              </div>
              <p className="text-sm">
                {t("EARN_REFERRAL_BONUS", {
                  referralRewardPercentage: isRewardPercentagePending
                    ? "..."
                    : rewardPercentage,
                })}
              </p>
            </div>
          </div>
        </section>
        <section className="flex w-full items-center justify-between gap-4 py-2">
          <Card className="w-full border-none bg-primary/10 shadow-none">
            <CardHeader>
              <CardTitle>{t("REFER_AND_EARN")}</CardTitle>
              <CardDescription>
                {t("REFER_AND_EARN_DESCRIPTION_EARNABLE", {
                  referralRewardPercentage: isRewardPercentagePending
                    ? "..."
                    : rewardPercentage,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6">
              <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-[0_0_14px_0_var(--primary-shadow)]">
                <p className="text-sm">{t("INVITE_VIA_REFERRAL_LINK")}</p>
                <Button
                  className="w-full border-primary"
                  onClick={generateLink}
                  disabled={isPending}>
                  <p>{isPending ? t("GENERATING_LINK") : t("GENERATE_LINK")}</p>
                </Button>
                {shareUrl && (
                  <div className="flex w-full items-center gap-2">
                    <div className="w-4/5 overflow-hidden rounded-lg bg-background p-1 shadow-[0_0_19px_0_var(--primary-shadow)]">
                      <div className="inline-block whitespace-nowrap">
                        <span className="font-medium text-muted-foreground text-xs">
                          {shareUrl}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={copyReferralLink}
                      className="w-1/10 shadow-[0_0_19px_0_var(--primary-shadow)]"
                      variant="ghost"
                      size="icon">
                      <Copy className="size-4 text-primary" />
                    </Button>
                    <Button
                      onClick={shareReferralLink}
                      className="w-1/10 shadow-[0_0_19px_0_var(--primary-shadow)]"
                      variant="ghost"
                      size="icon">
                      <Share className="size-4 text-primary" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
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
        </section>

        <section className="flex w-full flex-col justify-between gap-4 py-2">
          <h3 className="font-medium text-lg">{t("REFERRALS")}</h3>
          <Tabs defaultValue="GIVEN">
            <TabsList className="gap-2 bg-transparent p-0">
              <TabsTrigger
                className="w-24 cursor-pointer rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                value="GIVEN">
                {t("GIVEN")}
              </TabsTrigger>
              <TabsTrigger
                className="w-24 cursor-pointer rounded-full border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                value="RECEIVED">
                {t("RECEIVED")}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="GIVEN"
              className="rounded-xl border border-border">
              {isRecommendationsGivenPending ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table className="w-full border-separate border-spacing-y-2 px-4">
                  <TableHeader>
                    <TableRow className="border-none">
                      <TableHead>S. No.</TableHead>
                      <TableHead>{t("ADDRESS")}</TableHead>
                      <TableHead>{t("DATE")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendationsGiven.length === 0 ? (
                      <TableRow className="border-none">
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-muted-foreground">
                          {t("NO_RECOMMENDATIONS_GIVEN")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      recommendationsGiven.map((referral) => (
                        <TableRow
                          key={referral.id}
                          className="border-none bg-border/30">
                          <TableCell className="first:rounded-l-md">
                            {referral.id}
                          </TableCell>
                          <TableCell>
                            {truncateAddress(referral.address)}
                          </TableCell>
                          <TableCell className="last:rounded-r-md">
                            {referral.date}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent
              value="RECEIVED"
              className="rounded-xl border border-border">
              {isRecommendationsReceivedPending ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <Table className="w-full border-separate border-spacing-y-2 px-4">
                  <TableHeader>
                    <TableRow className="border-none">
                      <TableHead>S. No.</TableHead>
                      <TableHead>{t("ADDRESS")}</TableHead>
                      <TableHead>{t("DATE")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendationsReceived.length === 0 ? (
                      <TableRow className="border-none">
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground">
                          {t("NO_RECOMMENDATIONS_RECEIVED")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      recommendationsReceived.map((referral) => (
                        <TableRow
                          key={referral.id}
                          className="border-none bg-border/30 hover:bg-border/50">
                          <TableCell className="first:rounded-l-md">
                            {referral.id}
                          </TableCell>
                          <TableCell>
                            {truncateAddress(referral.address)}
                          </TableCell>
                          <TableCell>{referral.date}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </section>
        <section className="flex w-full flex-col justify-between gap-4 py-2">
          <SectionHeader title={t("FAQS")} seeAllLink={INTERNAL_HREFS.HELP} />
          <FAQAccordion faqs={getPageFAQs("REFERRAL_PAGE")} />
        </section>
      </main>
    </>
  );
}
