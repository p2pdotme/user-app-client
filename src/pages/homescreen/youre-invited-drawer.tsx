import { Loader2, MailCheck, QrCode, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useThirdweb } from "@/hooks";
import {
  useClaimRecommendation,
  useRecommendationUrlParams,
} from "@/hooks/use-referral-link";
import { truncateAddress } from "@/lib/utils";
import { AccessGrantedDrawer } from "./access-granted-drawer";
import { RequestInProgressDrawer } from "./request-in-progress-drawer";

type ClaimStatus = "idle" | "success" | "loading";

interface YoureInvitedDrawerProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  referrer?: string; // e.g., "0xAB...123"
}

export function YoureInvitedDrawer({
  open,
  onClose,
  onClaim,
  referrer = "0xAB...123",
}: YoureInvitedDrawerProps) {
  const { t } = useTranslation();
  const { account, connect } = useThirdweb();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");

  const { senderAddr, checkRecommendationParams, clearUrlParams } =
    useRecommendationUrlParams();

  const { mutateAsync: claimRecommendationMutate, isPending: isClaiming } =
    useClaimRecommendation();

  // Check for recommendation URL parameters when drawer opens
  useEffect(() => {
    if (open) {
      const { hasParams } = checkRecommendationParams();
      if (hasParams) {
        setClaimStatus("idle");
      }
    }
  }, [open, checkRecommendationParams]);

  const handleClaimRecommendation = async () => {
    if (!account?.address) {
      toast.error(t("WALLET_NOT_CONNECTED"));
      return;
    }

    const { address, nonce, signature } = checkRecommendationParams();

    if (!address || !nonce || !signature) {
      toast.error(t("INVALID_RECOMMENDATION_PARAMETERS"));
      return;
    }

    setClaimStatus("loading");

    claimRecommendationMutate(
      {
        recommender: address as Address,
        recipient: account.address as Address,
        nonce: BigInt(nonce),
        signature: signature,
      },
      {
        onSuccess: () => {
          setClaimStatus("success");
          clearUrlParams();
          onClaim();
        },
        onError: () => {
          handleClose();
        },
      },
    );
  };

  const handleLoginAndClaim = () => {
    // Trigger login and then claim
    connect();
    // The claim will be handled once the user is connected
  };

  const handleClose = () => {
    setClaimStatus("idle");
    clearUrlParams();
    onClose();
  };

  const displayReferrer = senderAddr || referrer;

  // Show RequestInProgressDrawer during loading state
  const isLoading = claimStatus === "loading" || isClaiming;
  if (isLoading) {
    return <RequestInProgressDrawer open={open} onClose={handleClose} />;
  }

  // Show AccessGrantedDrawer on success
  if (claimStatus === "success") {
    return (
      <AccessGrantedDrawer
        open={claimStatus === "success"}
        onClose={() => {
          handleClose();
        }}
      />
    );
  }

  // Show main invite drawer for initial state
  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerTitle>{t("YOUVE_BEEN_INVITED")}</DrawerTitle>
      <DrawerContent className="mx-auto rounded-2xl bg-background">
        <div className="flex h-full max-h-[80vh] flex-col overflow-y-auto px-6 py-8">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="flex items-center justify-center rounded-full bg-primary/10 p-4">
              <span className="flex items-center justify-center rounded-full bg-primary p-4">
                <MailCheck className="size-12 text-background" />
              </span>
            </div>
            <h2 className="font-regular text-2xl">{t("YOUVE_BEEN_INVITED")}</h2>
            <p className="text-muted-foreground">
              {t("YOUVE_BEEN_REFERRED_BY_TRUSTED_USER")}
              <br />
              <span className="font-mono text-primary">
                {truncateAddress(displayReferrer)}
              </span>
            </p>
            <div className="mt-2 w-full space-y-4 text-left">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Zap className="size-5 text-primary" />
                {t("BUY_SELL_USDC_WITHIN_SECONDS")}
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <QrCode className="size-5 text-primary" />
                {t("SPEND_USDC_ANYWHERE_SCAN_QR")}
              </div>
            </div>
            <DrawerFooter className="w-full flex-shrink-0 px-0">
              <div className="w-full space-y-3">
                {account?.address ? (
                  <Button
                    size="lg"
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    onClick={handleClaimRecommendation}
                    disabled={isClaiming || isLoading}>
                    {(isClaiming || isLoading) && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t("CLAIM_ACCESS")}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-primary text-white hover:bg-primary/90"
                    onClick={handleLoginAndClaim}>
                    {t("LOGIN_TO_CLAIM_YOUR_REWARDS")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-primary text-primary hover:bg-primary/10"
                  onClick={handleClose}>
                  {t("CANCEL")}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
