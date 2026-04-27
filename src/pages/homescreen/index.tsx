import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import ASSETS from "@/assets";
import {
  Banner,
  useYouTubeVideoDialog,
  YouTubeVideoDialog,
} from "@/components";
import { TgeCountdownBanner } from "@/components/tge-countdown-banner";
import { Button } from "@/components/ui/button";
import {
  useAnalytics,
  useCampaignClaim,
  useHapticInteractions,
  useRecommendationUrlParams,
  useThirdweb,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { BalanceIndicator } from "./balance-indicator";
import { CashbackEarnedCard } from "./cashback-earned-card";
import { ClaimGiftsDrawer } from "./claim-gifts-drawer";
import { ClaimMonthlyDropCard } from "./claim-monthly-drop-card";
import { DepositDrawer } from "./deposit-drawer";
import { Footer } from "./footer";
import { Header } from "./header";
import { PerTxnLimit } from "./per-txn-limits";
import { PriceIndicator } from "./price-indicator";
import { ProcessingTransactions } from "./processing-txns";
import { Referral } from "./referral";
import { WithdrawDrawer } from "./withdraw-drawer";
import { YoureInvitedDrawer } from "./youre-invited-drawer";

export function HomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { openDetailsModal, connect, account } = useThirdweb();
  const { onNavigate } = useHapticInteractions();
  const { track } = useAnalytics();
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [showCampaignDrawer, setShowCampaignDrawer] = useState(false);

  const queryClient = useQueryClient();

  const { senderAddr, checkRecommendationParams, clearUrlParams } =
    useRecommendationUrlParams();

  const {
    hasCampaignParams,
    claimCampaign,
    clearUrlParams: clearCampaignUrlParams,
    claimCampaignMutation,
  } = useCampaignClaim();

  useEffect(() => {
    if (location.pathname === INTERNAL_HREFS.CAMPAIGN) {
      const searchParams = new URLSearchParams(location.search);
      const manager = searchParams.get("manager");
      const id = searchParams.get("id");

      // Only redirect if both parameters are missing
      if (!manager || !id) {
        navigate(INTERNAL_HREFS.HOME, { replace: true });
      }
    }
    if (location.pathname === INTERNAL_HREFS.RECOMMEND) {
      const searchParams = new URLSearchParams(location.search);
      const address = searchParams.get("address");
      const nonce = searchParams.get("nonce");
      const signature = searchParams.get("signature");

      // Only redirect if any of the required parameters are missing
      if (!address || !nonce || !signature) {
        navigate(INTERNAL_HREFS.HOME, { replace: true });
      }
    }
  }, [location.pathname, navigate, location.search]);

  // Check for recommendation URL parameters on mount
  useEffect(() => {
    const { hasParams } = checkRecommendationParams();
    if (hasParams) {
      setShowInviteDrawer(true);
    }
  }, [checkRecommendationParams]);

  // Check for campaign URL parameters on mount
  useEffect(() => {
    if (hasCampaignParams) {
      setShowCampaignDrawer(true);
    }
  }, [hasCampaignParams]);

  const handleCloseInviteDrawer = () => {
    setShowInviteDrawer(false);
    clearUrlParams();
  };

  const handleCloseCampaignDrawer = () => {
    setShowCampaignDrawer(false);
    clearCampaignUrlParams();
  };

  const handleClaimAccess = () => {
    if (!account?.address) {
      // If user is not logged in, trigger login
      connect();
    }
    // The drawer will handle the claim logic internally
  };

  const handleClaimCampaign = () => {
    if (!account?.address) {
      // If user is not logged in, trigger login
      connect();
    } else {
      // Claim the campaign reward
      claimCampaign();
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries();
    };

    window.addEventListener("app:refresh", handleRefresh);

    return () => {
      window.removeEventListener("app:refresh", handleRefresh);
    };
  }, [queryClient]);

  // Enhanced handlers with haptic feedback
  const handleWalletClick = () => {
    onNavigate(); // Trigger haptic feedback for navigation
    track(EVENTS.FEATURE, {
      status: "action_clicked",
      location: "homescreen",
      action: "wallet",
      userId: account?.address || "anonymous",
    });
    openDetailsModal();
  };

  const handleSupportClick = () => {
    onNavigate(); // Trigger haptic feedback for navigation
    track(EVENTS.FEATURE, {
      status: "action_clicked",
      location: "homescreen",
      action: "support",
      userId: account?.address || "anonymous",
    });
    // Link navigation will be handled by React Router
  };

  const { isOpen, videoUrl, title, openVideo, closeVideo } =
    useYouTubeVideoDialog();

  return (
    <>
      <Header />
      <main className="container-narrow flex w-full flex-col">
        <section className="flex w-full flex-col items-center justify-center gap-2 py-4">
          <PriceIndicator />
          <BalanceIndicator />
        </section>
        <section className="flex w-full items-center justify-between gap-4 py-2">
          <Button
            type="button"
            variant="ghost"
            className="flex cursor-pointer flex-col items-center gap-2 p-0"
            onClick={handleWalletClick}>
            <div className="rounded-xl border border-primary p-4">
              <ASSETS.ICONS.ActionWallet className="size-7 shrink-0 text-primary" />
            </div>
            <p className="text-sm">{t("WALLET")}</p>
          </Button>
          <DepositDrawer>
            <div className="flex cursor-pointer flex-col items-center gap-2">
              <div className="rounded-xl border border-primary p-4">
                <ASSETS.ICONS.ActionDeposit className="size-7 shrink-0 text-primary" />
              </div>
              <p className="text-sm">{t("DEPOSIT")}</p>
            </div>
          </DepositDrawer>
          <WithdrawDrawer>
            <div className="flex cursor-pointer flex-col items-center gap-2">
              <div className="rounded-xl border border-primary p-4">
                <ASSETS.ICONS.ActionWithdraw className="size-7 shrink-0 text-primary" />
              </div>
              <p className="text-sm">{t("WITHDRAW")}</p>
            </div>
          </WithdrawDrawer>
          <Link
            to={INTERNAL_HREFS.HELP}
            className="flex flex-col items-center gap-2"
            onClick={handleSupportClick}
            viewTransition
            style={{
              viewTransitionName: "support",
            }}>
            <div className="rounded-xl border border-primary p-4">
              <ASSETS.ICONS.ActionSupport className="size-7 shrink-0 text-primary" />
            </div>
            <p className="text-sm">{t("SUPPORT")}</p>
          </Link>
        </section>

        <ClaimMonthlyDropCard />
        <CashbackEarnedCard />

        <section className="flex w-full flex-col items-center justify-center py-2">
          <TgeCountdownBanner />
        </section>

        <section className="flex w-full flex-col items-center justify-center py-4">
          <Banner openVideo={openVideo} />
        </section>

        <ProcessingTransactions />

        <section className="flex w-full flex-col items-center justify-center py-4">
          <PerTxnLimit />
        </section>

        <section className="flex w-full flex-col items-center justify-center py-4">
          <Referral />
        </section>

        {showInviteDrawer && (
          <YoureInvitedDrawer
            open={showInviteDrawer}
            onClose={handleCloseInviteDrawer}
            onClaim={handleClaimAccess}
            referrer={senderAddr || ""}
          />
        )}

        {showCampaignDrawer && (
          <ClaimGiftsDrawer
            open={showCampaignDrawer}
            onClose={handleCloseCampaignDrawer}
            onClaim={handleClaimCampaign}
            isLoading={claimCampaignMutation.isPending}
          />
        )}

        <YouTubeVideoDialog
          isOpen={isOpen}
          onClose={closeVideo}
          videoUrl={videoUrl}
          title={title}
        />
      </main>
      <Footer />
    </>
  );
}
