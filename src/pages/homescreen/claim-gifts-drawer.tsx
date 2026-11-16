import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AlertCircle, Loader2 } from "lucide-react";
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
  /**
   * Friendly, already-translated reason the last claim failed. When set the
   * drawer stays open, shows it and turns the primary button into Retry.
   */
  errorMessage?: string | null;
}

export function ClaimGiftsDrawer({
  open,
  onClose,
  onClaim,
  isLoading = false,
  errorMessage = null,
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
          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex w-full items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-left">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-destructive text-sm">
                  {t("FAILED_TO_CLAIM_CAMPAIGN_REWARD")}
                </p>
                <p className="text-destructive text-xs">{errorMessage}</p>
              </div>
            </div>
          )}
          <DrawerFooter className="mt-4 flex-shrink-0 px-0">
            <Button
              size="lg"
              className="w-full"
              onClick={onClaim}
              disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {errorMessage ? t("RETRY") : t("CLAIM_ACCESS")}
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
