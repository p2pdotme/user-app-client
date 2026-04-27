import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RequestInProgressDrawer } from "./request-in-progress-drawer";

interface ClaimGiftsDrawerProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  isLoading?: boolean;
}

export function ClaimGiftsDrawer({
  open,
  onClose,
  onClaim,
  isLoading = false,
}: ClaimGiftsDrawerProps) {
  const { t } = useTranslation();

  // Show RequestInProgressDrawer during loading state
  if (isLoading) {
    return <RequestInProgressDrawer open={open} onClose={onClose} />;
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerTitle>{t("YOU_RE_READY_TO_CLAIM_YOUR_BONUS")}</DrawerTitle>
      <DrawerContent className="mx-auto bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <DotLottieReact
              className="h-40"
              src={ASSETS.ANIMATIONS.GIFT_BOX}
              autoplay
            />
            <h2 className="font-bold text-2xl">
              {t("YOU_RE_READY_TO_CLAIM_YOUR_BONUS")}
            </h2>
            <p className="text-muted-foreground">
              {t("YOU_VE_RECEIVED_A_SPECIAL_INVITE")}
            </p>
            <div className="w-full text-left">
              <div className="mb-2 font-semibold">
                {t("HOW_TO_GET_YOUR_BONUS")}
              </div>
              <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                <li>{t("HOW_TO_CLAIM_YOUR_BONUS_STEP_1")}</li>
                <li>{t("HOW_TO_CLAIM_YOUR_BONUS_STEP_2")}</li>
                <li>{t("HOW_TO_CLAIM_YOUR_BONUS_STEP_3")}</li>
              </ol>
            </div>
          </div>
          <DrawerFooter className="mt-4 flex-shrink-0 px-0">
            <Button
              size="lg"
              className="w-full"
              onClick={onClaim}
              disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("CLAIM_ACCESS")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={onClose}
              disabled={isLoading}>
              {t("CANCEL")}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
