import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ClaimRewardSuccessDrawerProps {
  open: boolean;
  onClose: () => void;
  amount: string;
  rewardType: "monthly_drop" | "referral_commission";
}

export function ClaimRewardSuccessDrawer({
  open,
  onClose,
  amount,
  rewardType,
}: ClaimRewardSuccessDrawerProps) {
  const { t } = useTranslation();

  const handleShareOnTwitter = () => {
    const tweetText =
      rewardType === "monthly_drop"
        ? `I was one of the top 1000 users by volume on @P2Pdotme this month and just claimed $${amount} USDC as a reward!`
        : `I just claimed $${amount} USDC in referral commissions from @P2Pdotme!`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerTitle className="sr-only">{t("REWARD_CLAIMED")}</DrawerTitle>
      <DrawerContent className="mx-auto bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <DotLottieReact
              className="h-40"
              src={ASSETS.ANIMATIONS.COMPLETED}
              autoplay
            />
            <h2 className="font-bold text-2xl">{t("REWARD_CLAIMED")}</h2>
            <p className="text-muted-foreground">
              {t("REWARD_CLAIMED_DESCRIPTION", { amount })}
            </p>
            <div className="flex w-full flex-col items-center gap-2 rounded-xl bg-primary/10 p-4">
              <p className="font-bold text-3xl text-primary">${amount} USDC</p>
              <p className="text-muted-foreground text-sm">
                {t("ADDED_TO_YOUR_BALANCE")}
              </p>
            </div>
          </div>
          <DrawerFooter className="mt-6 flex-shrink-0 px-0">
            <Button
              size="lg"
              className="flex w-full items-center justify-center gap-2"
              onClick={handleShareOnTwitter}>
              <ASSETS.ICONS.Twitter className="size-5" />
              <span>{t("SHARE_ON_TWITTER")}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={onClose}>
              {t("MAYBE_LATER")}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
