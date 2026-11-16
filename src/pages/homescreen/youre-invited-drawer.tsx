import { AlertCircle, Loader2, MailCheck, QrCode, Zap } from "lucide-react";
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
import { useAnalytics, useThirdweb } from "@/hooks";
import {
  useClaimRecommendation,
  useRecommendationUrlParams,
} from "@/hooks/use-referral-link";
import { getUserFacingErrorReasonKey } from "@/hooks/use-thirdweb";
import { EVENTS } from "@/lib/analytics";
import { parseContractError } from "@/lib/errors";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { truncateAddress } from "@/lib/utils";
import { AccessGrantedDrawer } from "./access-granted-drawer";
import { RequestInProgressDrawer } from "./request-in-progress-drawer";

type ClaimStatus = "idle" | "success" | "loading" | "error";

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
  const { track } = useAnalytics();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  // Friendly, already-translated reason for the last failed claim.
  const [claimError, setClaimError] = useState<string | null>(null);

  const { senderAddr, checkRecommendationParams, clearUrlParams } =
    useRecommendationUrlParams();

  const { mutate: claimRecommendationMutate, isPending: isClaiming } =
    useClaimRecommendation();

  // Check for recommendation URL parameters when drawer opens
  useEffect(() => {
    if (open) {
      const { hasParams } = checkRecommendationParams();
      if (hasParams) {
        setClaimStatus("idle");
        setClaimError(null);
      }
    }
  }, [open, checkRecommendationParams]);

  // Invitee funnel: drawer shown (once per open).
  useEffect(() => {
    if (open) {
      track(EVENTS.REFERRAL, { status: "invite_drawer_shown" });
    }
  }, [open, track]);

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
    setClaimError(null);
    track(EVENTS.REFERRAL, { status: "invite_claim_started" });

    claimRecommendationMutate(
      {
        recommender: address as Address,
        recipient: account.address as Address,
        nonce: BigInt(nonce),
        signature: signature,
      },
      {
        onSuccess: () => {
          track(EVENTS.REFERRAL, { status: "invite_claim_success" });
          setClaimStatus("success");
          clearUrlParams();
          onClaim();
        },
        onError: (error) => {
          // Keep the drawer (and the invite params) so the user can retry
          // instead of silently losing the invite.
          if (isUserCancellation(error)) {
            track(EVENTS.REFERRAL, { status: "invite_claim_cancelled" });
            setClaimStatus("idle");
            return;
          }
          const contractErrorKey = parseContractError(error);
          track(EVENTS.REFERRAL, {
            status: "invite_claim_failed",
            reason: contractErrorKey ?? getUserFacingErrorReasonKey(error),
          });
          setClaimError(
            contractErrorKey
              ? t(contractErrorKey)
              : getUserFacingErrorMessage(t, error),
          );
          setClaimStatus("error");
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
    setClaimError(null);
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
            {claimStatus === "error" && (
              <div
                role="alert"
                className="flex w-full items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-left">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-destructive text-sm">
                    {t("ONB_INVITE_CLAIM_FAILED_TITLE")}
                  </p>
                  {claimError && (
                    <p className="text-destructive/80 text-xs">{claimError}</p>
                  )}
                </div>
              </div>
            )}
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
                    {claimStatus === "error" ? t("RETRY") : t("CLAIM_ACCESS")}
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
