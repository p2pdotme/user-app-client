import { Gift } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useClaimCampaignUsdc,
  useHasUnclaimedCampaignRewards,
} from "@/hooks/use-campaign-claim";
import { ClaimRewardSuccessDrawer } from "./claim-reward-success-drawer";

export function ClaimMonthlyDropCard() {
  const { t } = useTranslation();
  const { hasUnclaimedRewards, rewardAmount, isLoading } =
    useHasUnclaimedCampaignRewards();
  const { claimCampaignUsdcReward, claimCampaignUsdcMutation } =
    useClaimCampaignUsdc();
  const [showSuccessDrawer, setShowSuccessDrawer] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState("0");

  const formattedAmount = formatUnits(rewardAmount, 6);
  const displayAmount = Number(formattedAmount).toFixed(2);

  const handleClaim = async () => {
    setClaimedAmount(displayAmount);
    const success = await claimCampaignUsdcReward();
    if (success) {
      setShowSuccessDrawer(true);
    }
  };

  const handleCloseSuccessDrawer = () => {
    setShowSuccessDrawer(false);
  };

  // Don't show if no unclaimed rewards or loading, but keep mounted while success drawer is open
  if ((isLoading || !hasUnclaimedRewards) && !showSuccessDrawer) {
    return null;
  }

  // Only show the success drawer if we just claimed (card is hidden after claim)
  if (!hasUnclaimedRewards && showSuccessDrawer) {
    return (
      <ClaimRewardSuccessDrawer
        open={showSuccessDrawer}
        onClose={handleCloseSuccessDrawer}
        amount={claimedAmount}
        rewardType="monthly_drop"
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <Card className="w-full border-none bg-primary/5">
        <CardHeader>
          <CardTitle>{t("MONTHLY_REWARD_DROP")}</CardTitle>
          <CardDescription>
            {t("MONTHLY_REWARD_DROP_DESCRIPTION")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-background">
              <Gift className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                {t("CLAIMABLE_REWARDS")}
              </p>
              <p className="bg-linear-to-b from-primary to-primary/50 bg-clip-text font-bold text-3xl text-transparent">
                ${displayAmount}
              </p>
            </div>
          </div>
          <Button
            onClick={handleClaim}
            disabled={claimCampaignUsdcMutation.isPending}>
            {claimCampaignUsdcMutation.isPending
              ? t("CLAIMING")
              : t("CLAIM_MONTHLY_REWARD")}
          </Button>
        </CardContent>
      </Card>

      <ClaimRewardSuccessDrawer
        open={showSuccessDrawer}
        onClose={handleCloseSuccessDrawer}
        amount={claimedAmount}
        rewardType="monthly_drop"
      />
    </div>
  );
}
