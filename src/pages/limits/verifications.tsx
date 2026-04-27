import {
  type AnonAadhaarCore,
  deserialize,
  packGroth16Proof,
} from "@anon-aadhaar/core";
import {
  LaunchProveModal,
  useAnonAadhaar,
  useProver,
} from "@anon-aadhaar/react";
import { usePrices } from "@p2pdotme/sdk/react";
import {
  createReclaimFlow,
  createZkPassportFlow,
  DEFAULT_RECLAIM_PROVIDER_IDS,
  RECLAIM_APP_LINKS,
  type ReclaimFlowParams,
  type ReclaimProofResult,
  type ReclaimStatus,
  type ZkPassportStatus as SdkZkPassportStatus,
  type SocialPlatform,
  type SocialVerifyParams,
  ZK_PASSPORT_APP_LINKS,
} from "@p2pdotme/sdk/zkkyc";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Clock4,
  Fingerprint,
  Loader2,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts";
import { useDomainReachability } from "@/contexts/domain-reachability";
import { useAnalytics } from "@/hooks";
import { useThirdweb } from "@/hooks/use-thirdweb";
import {
  useAadhaarRpReward,
  useAadhaarVerificationStatus,
  useSocialRpRewards,
  useSocialVerificationStatus,
  useSocialVerify,
  useSubmitAnonAadhaarProof,
  useZkPassportRegister,
  useZkPassportRpReward,
} from "@/hooks/use-tx-limits";
import { EVENTS } from "@/lib/analytics";
import { RECLAIM_APP } from "@/lib/constants";
import {
  clearStoredParams,
  getStoredParams,
} from "@/lib/url-param-preservation";
import { getScreenType, isAndroid, isIOS } from "@/lib/utils";

/** Set to true to temporarily hide Aadhaar verification from the limits page */
const HIDE_AADHAAR_VERIFICATION = true;

export enum StateStatusEnum {
  IDLE = "IDLE",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

type SocialPlatformType =
  | "LinkedIn"
  | "GitHub"
  | "X"
  | "Instagram"
  | "Facebook"
  | "Aadhaar"
  | "ZKPassport";

export function Verifications() {
  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  let sessionId = searchParams.get("sessionId");
  let socialPlatform = searchParams.get("socialPlatform");

  // Fallback to stored parameters if not found in URL
  if (!sessionId || !socialPlatform) {
    const storedParams = getStoredParams();
    if (storedParams) {
      sessionId = sessionId || storedParams.sessionId || null;
      socialPlatform = socialPlatform || storedParams.socialPlatform || null;
    }
  }

  // Aadhaar hooks
  const [anonAadhaar] = useAnonAadhaar();
  const [, _latestProof] = useProver();

  const [, setAnonAadhaarCore] = useState<AnonAadhaarCore>();

  // ZkPassport state
  const [zkPassportUrl, setZkPassportUrl] = useState<string>("");
  const [showZkPassportTutorial, setShowZkPassportTutorial] = useState(false);
  const [isZkPassportLoading, setIsZkPassportLoading] = useState(false);
  const [zkPassportStatus, setZkPassportStatus] = useState<string | null>(null);

  // Aadhaar hooks
  const {
    isAadhaarVerified,
    isAadhaarStatusLoading,
    aadhaarStatusError,
    refetchAadhaarStatus,
  } = useAadhaarVerificationStatus();

  const { aadhaarRp, isAadhaarRpLoading, isAadhaarRpError, aadhaarRpError } =
    useAadhaarRpReward();

  // Use real hooks for ZkPassport verification status and RP reward
  const {
    isZkPassportVerified,
    isZkPassportStatusLoading,
    zkPassportStatusError,
    refetchZkPassportStatus,
  } = useSocialVerificationStatus();

  const {
    zkPassportRp: zkPassportRpReward,
    isZkPassportRpLoading,
    isZkPassportRpError,
    zkPassportRpError,
  } = useZkPassportRpReward();

  const {
    mutateAsync: submitAnonAadhaarProof,
    isPending: isAadhaarProofPending,
    isError: isAadhaarProofError,
    error: aadhaarProofError,
  } = useSubmitAnonAadhaarProof();

  const {
    mutateAsync: registerZkPassport,
    isPending: isZkPassportRegisterPending,
  } = useZkPassportRegister();

  const { settings } = useSettings();

  const handleZkPassportVerification = async () => {
    if (!account?.address) {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY"));
      return;
    }

    // Track tutorial shown
    track(EVENTS.VERIFICATION, {
      verification_type: "zkpassport",
      status: "tutorial_shown",
      userAddress: account.address,
    });

    // Show tutorial first
    setShowZkPassportTutorial(true);
  };

  const handleZkPassportContinueToVerification = async () => {
    if (!account?.address) {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY"));
      return;
    }

    // Track verification initiated
    track(EVENTS.VERIFICATION, {
      verification_type: "zkpassport",
      status: "initiated",
      userAddress: account.address,
    });

    // Keep drawer open, just start loading and show QR when ready
    setIsZkPassportLoading(true);
    setZkPassportStatus(null);

    const sessionResult = await createZkPassportFlow({
      domain: "app.p2p.me",
      name: "ZKPassport",
      logo: "https://app.p2p.lol/favicon.svg",
      purpose: "Prove your personhood",
      walletAddress: account.address as `0x${string}`,
      onStatus: (status: SdkZkPassportStatus) => {
        switch (status.type) {
          case "request_created": {
            const screenType = getScreenType();
            setZkPassportUrl(status.url);
            if (screenType === "phone") {
              window.open(status.url, "_blank");
            }
            break;
          }
          case "request_received":
            track(EVENTS.VERIFICATION, {
              verification_type: "zkpassport",
              status: "request_received",
              userAddress: account.address,
            });
            setZkPassportStatus(t("ZK_PASSPORT_REQUEST_RECEIVED"));
            break;
          case "generating_proof":
            track(EVENTS.VERIFICATION, {
              verification_type: "zkpassport",
              status: "proof_generating",
              userAddress: account.address,
            });
            setZkPassportStatus(t("ZK_PASSPORT_PROOF_GENERATING"));
            break;
          case "proof_generated":
            track(EVENTS.VERIFICATION, {
              verification_type: "zkpassport",
              status: "proof_generated",
              userAddress: account.address ?? "",
            });
            setZkPassportStatus(t("ZK_PASSPORT_PROOF_GENERATED"));
            break;
          case "result_received":
            setZkPassportStatus(t("ZK_PASSPORT_PROOF_SUBMITTED"));
            break;
          case "rejected":
            track(EVENTS.VERIFICATION, {
              verification_type: "zkpassport",
              status: "cancelled",
              userAddress: account?.address ?? "",
              errorMessage: "User rejected verification",
            });
            setIsZkPassportLoading(false);
            setShowZkPassportTutorial(false);
            setZkPassportUrl("");
            setZkPassportStatus(null);
            break;
        }
      },
    });

    if (sessionResult.isErr()) {
      console.error("Failed to initialize ZKPassport:", sessionResult.error);

      track(EVENTS.VERIFICATION, {
        verification_type: "zkpassport",
        status: "failed",
        userAddress: account.address,
        errorMessage: "Failed to initialize ZKPassport verification",
      });
      toast.error(t("ZK_PASSPORT_INITIALIZATION_FAILED"));
      setIsZkPassportLoading(false);
      setShowZkPassportTutorial(false);
      setZkPassportStatus(null);
      return;
    }

    const session = sessionResult.value;

    const proofResult = await session.result;

    if (proofResult.isErr()) {
      const error = proofResult.error;
      console.error("ZKPassport verification error:", error);
      const accountAddress = account?.address ?? "";
      track(EVENTS.VERIFICATION, {
        verification_type: "zkpassport",
        status: "failed",
        userAddress: accountAddress,
        errorMessage: error.message,
      });
      toast.error(
        t("VERIFICATION_FAILED_MESSAGE", {
          errorMessage: error.message,
        }),
      );
      setIsZkPassportLoading(false);
      setShowZkPassportTutorial(false);
      setZkPassportUrl("");
      setZkPassportStatus(null);
      return;
    }

    const { params: verifierParams, isIDCard } = proofResult.value;

    try {
      // Track contract call started
      track(EVENTS.VERIFICATION, {
        verification_type: "zkpassport",
        status: "contract_call_started",
        userAddress: account.address,
      });

      await registerZkPassport({
        params: verifierParams,
        isIDCard,
      })
        .then(() => {
          toast.success(t("VERIFICATION_SUCCESS"));
          track(EVENTS.VERIFICATION, {
            verification_type: "zkpassport",
            status: "completed",
            userAddress: account.address,
          });
        })
        .catch((error) => {
          track(EVENTS.VERIFICATION, {
            verification_type: "zkpassport",
            status: "contract_call_failed",
            userAddress: account.address,
            errorMessage: error.message as string,
          });
          toast.error(
            t("VERIFICATION_FAILED_MESSAGE", {
              errorMessage: error.message as string,
            }),
          );
        });

      setShowZkPassportTutorial(false);
      setZkPassportUrl("");
      setZkPassportStatus(null);
      refetchZkPassportStatus();
    } catch (error) {
      console.error("Failed to register ZKPassport onchain:", error);
      track(EVENTS.VERIFICATION, {
        verification_type: "zkpassport",
        status: "failed",
        userAddress: account?.address ?? "",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    setIsZkPassportLoading(false);
  };

  const { track } = useAnalytics();
  const { account } = useThirdweb();

  useEffect(() => {
    if (isAadhaarProofError) {
      track(EVENTS.VERIFICATION, {
        verification_type: "aadhaar",
        status: "failed",
        errorMessage: aadhaarProofError.cause as string,
        userAddress: account?.address,
      });
      toast.error(
        t("VERIFICATION_FAILED_MESSAGE", {
          errorMessage: aadhaarProofError.cause as string,
        }),
      );
    }
  }, [isAadhaarProofError, aadhaarProofError, t, track, account]);

  const [aadhaarProofLoading, setAadhaarProofLoading] = useState(false);
  const aadhaarSubmissionInProgressRef = useRef(false);

  useEffect(() => {
    // Wait for verification status to load before attempting submission
    if (isAadhaarStatusLoading) {
      return;
    }

    // Don't attempt if already verified
    if (isAadhaarVerified) {
      return;
    }

    // Prevent concurrent submissions
    if (aadhaarSubmissionInProgressRef.current || isAadhaarProofPending) {
      return;
    }

    if (anonAadhaar.status === "logged-in") {
      console.log("anonAadhaar", anonAadhaar);
      const aaObj = localStorage.getItem("anonAadhaar");
      const anonAadhaarProofs = aaObj
        ? JSON.parse(aaObj).anonAadhaarProofs
        : undefined;
      if (anonAadhaarProofs === undefined || anonAadhaarProofs?.length === 0)
        return;
      deserialize(
        anonAadhaarProofs[Object.keys(anonAadhaarProofs)?.length - 1].pcd,
      ).then(async (result) => {
        setAnonAadhaarCore(result);

        if (result && !isAadhaarVerified && !isAadhaarProofPending) {
          // Prevent concurrent submissions
          if (aadhaarSubmissionInProgressRef.current) {
            return;
          }

          aadhaarSubmissionInProgressRef.current = true;
          setAadhaarProofLoading(true);
          track(EVENTS.VERIFICATION, {
            verification_type: "aadhaar",
            status: "initiated",
            userAddress: account?.address,
          });
          try {
            const nullifierSeed = BigInt(result.proof.nullifierSeed);
            const nullifier = BigInt(result.proof.nullifier);
            const timestamp = BigInt(result.proof.timestamp);
            const signal = BigInt(1);
            const revealArray: [bigint, bigint, bigint, bigint] = [
              BigInt(result.proof.ageAbove18),
              BigInt(result.proof.gender),
              BigInt(result.proof.pincode),
              BigInt(result.proof.state),
            ];
            const packedGroth16Proof = packGroth16Proof(
              result.proof.groth16Proof,
            ).map((str) => BigInt(str)) as [
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
            ];
            await submitAnonAadhaarProof({
              nullifierSeed,
              nullifier,
              timestamp,
              signal,
              revealArray,
              packedGroth16Proof,
            });
            refetchAadhaarStatus();
            track(EVENTS.VERIFICATION, {
              verification_type: "aadhaar",
              status: "completed",
              userAddress: account?.address,
            });

            toast.success(t("VERIFIED_TOAST_TITLE", { title: "Aadhaar" }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : typeof err === "string"
                  ? err
                  : "Aadhaar verification failed";
            track(EVENTS.VERIFICATION, {
              verification_type: "aadhaar",
              status: "failed",
              errorMessage,
              userAddress: account?.address,
            });
            toast.error(
              t("VERIFICATION_FAILED_MESSAGE", {
                errorMessage,
              }),
            );
          } finally {
            // Clear state after submission (success or error) to prevent retries
            aadhaarSubmissionInProgressRef.current = false;
            setAadhaarProofLoading(false);
            // Clear localStorage to prevent retry on refresh
            localStorage.removeItem("anonAadhaar");
          }
        }
      });
    }
  }, [
    anonAadhaar,
    isAadhaarVerified,
    isAadhaarStatusLoading,
    isAadhaarProofPending,
    submitAnonAadhaarProof,
    refetchAadhaarStatus,
    t,
    track,
    account,
  ]);

  const {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
    isSocialStatusLoading,
    isSocialStatusError,
    socialStatusError,
    refetchSocialStatus,
  } = useSocialVerificationStatus();

  // Fetch RP rewards from contract
  const {
    linkedInRp,
    gitHubRp,
    instagramRp,
    xRp,
    facebookRp,
    isLoading: isRpLoading,
    isError: isRpError,
  } = useSocialRpRewards();

  const statusMap = {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
    isZkPassportVerified,
  };

  // Map social names to contract reward values
  const socialRewards: Record<string, number | undefined> = {
    LinkedIn: linkedInRp,
    GitHub: gitHubRp,
    Instagram: instagramRp,
    X: xRp,
    Facebook: facebookRp,
    ZkPassport: zkPassportRpReward,
  };

  const SOCIALS = [
    {
      name: "X" as SocialPlatformType,
      key: "isXVerified",
      icon: <ASSETS.ICONS.Twitter className="size-5 text-foreground" />,
      rpReward: socialRewards.X ?? 0,
    },
    {
      name: "Instagram" as SocialPlatformType,
      key: "isInstagramVerified",
      icon: <ASSETS.ICONS.Instagram className="size-5 text-foreground" />,
      rpReward: socialRewards.Instagram ?? 0,
    },
    {
      name: "Facebook" as SocialPlatformType,
      key: "isFacebookVerified",
      icon: <ASSETS.ICONS.Facebook className="size-5 text-foreground" />,
      rpReward: socialRewards.Facebook ?? 0,
    },
    {
      name: "LinkedIn" as SocialPlatformType,
      key: "isLinkedInVerified",
      icon: <ASSETS.ICONS.Linkedin className="size-5 text-foreground" />,
      rpReward: socialRewards.LinkedIn ?? 0,
    },
    {
      name: "GitHub" as SocialPlatformType,
      key: "isGitHubVerified",
      icon: <ASSETS.ICONS.Github className="size-5 text-foreground" />,
      rpReward: socialRewards.GitHub ?? 0,
    },
  ];

  const isAnySocialVerified =
    !!isLinkedInVerified ||
    !!isGitHubVerified ||
    !!isXVerified ||
    !!isInstagramVerified ||
    !!isFacebookVerified ||
    !!isZkPassportVerified;

  return (
    <>
      <h3 className="font-medium text-lg">
        {t("VERIFY_SECURELY")}, {t("INCREASE_LIMITS")}
      </h3>
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary via-primary/90 to-primary p-4 text-white">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <p className="text-base leading-relaxed">
            {t("VERIFY_SECURELY_DESCRIPTION")}
          </p>
          <ShieldCheck className="size-12 shrink-0 opacity-80" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        {SOCIALS.map((social) => (
          <VerificationItem
            key={social.name}
            name={social.name}
            icon={social.icon}
            usdcReward={0}
            rpReward={isRpLoading || isRpError ? 0 : social.rpReward}
            isVerified={
              isSocialStatusError
                ? false
                : !!statusMap[social.key as keyof typeof statusMap]
            }
            isStatusLoading={isSocialStatusLoading}
            socialStatusError={socialStatusError}
            refetchSocialStatus={refetchSocialStatus}
            sessionId={
              socialPlatform && socialPlatform === social.name
                ? sessionId || undefined
                : undefined
            }
          />
        ))}
        {!HIDE_AADHAAR_VERIFICATION &&
          settings.currency.country === "India" &&
          isAnySocialVerified && (
            <VerificationItem
              name="Aadhaar"
              icon={<Fingerprint className="size-5 text-foreground" />}
              usdcReward={0}
              rpReward={
                isAadhaarRpLoading || isAadhaarRpError || !aadhaarRp
                  ? 0
                  : aadhaarRp
              }
              isVerified={!!isAadhaarVerified}
              isStatusLoading={
                isAadhaarStatusLoading ||
                aadhaarProofLoading ||
                isAadhaarRpLoading
              }
              socialStatusError={
                aadhaarStatusError ||
                aadhaarRpError ||
                aadhaarProofError ||
                null
              }
              refetchSocialStatus={refetchAadhaarStatus}
              customButton={
                isAadhaarVerified ? (
                  <Button
                    className="bg-muted text-foreground hover:bg-muted"
                    onClick={() => {
                      toast.success(t("ALREADY_VERIFIED"));
                    }}>
                    <Check className="mr-2 size-4" />
                    {t("VERIFIED")}
                  </Button>
                ) : anonAadhaar?.status === "logged-out" ||
                  anonAadhaar?.status === "logged-in" ? (
                  isAadhaarProofPending ? (
                    <Button variant="outline" disabled>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t("SUBMITTING_PROOF")}
                    </Button>
                  ) : (
                    <div className="launch_prove_modal">
                      <LaunchProveModal
                        buttonStyle={{
                          border: "1px solid var(--primary)",
                          color: "var(--primary)",
                          background: "transparent",
                          borderRadius: "8px",
                          fontWeight: 500,
                          fontSize: 14,
                          boxShadow: "none",
                        }}
                        buttonTitle={t("GET_VERIFIED")}
                        nullifierSeed={0}
                      />
                    </div>
                  )
                ) : anonAadhaar && anonAadhaar?.status === "logging-in" ? (
                  <Button variant="outline" disabled>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("GENERATING_PROOF")}
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    {t("ERROR")}
                  </Button>
                )
              }
            />
          )}
        {
          <VerificationItem
            name="ZKPassport"
            icon={
              <ASSETS.ICONS.ZkPassport className="size-5 text-foreground" />
            }
            usdcReward={0}
            rpReward={
              isZkPassportRpLoading ||
              isZkPassportRpError ||
              !zkPassportRpReward
                ? 0
                : zkPassportRpReward
            }
            isVerified={!!isZkPassportVerified}
            isStatusLoading={isZkPassportStatusLoading || isZkPassportRpLoading}
            socialStatusError={
              zkPassportStatusError || zkPassportRpError || null
            }
            refetchSocialStatus={refetchZkPassportStatus}
            customButton={
              isZkPassportVerified ? (
                <Button
                  className="bg-muted text-foreground hover:bg-muted"
                  onClick={() => {
                    toast.success(t("ALREADY_VERIFIED"));
                  }}>
                  <Check className="mr-2 size-4" />
                  {t("VERIFIED")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleZkPassportVerification}
                  disabled={isZkPassportLoading || isZkPassportRegisterPending}>
                  {isZkPassportLoading || isZkPassportRegisterPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {isZkPassportRegisterPending
                        ? t("SUBMITTING_PROOF")
                        : t("INITIALIZING")}
                    </>
                  ) : (
                    t("GET_VERIFIED")
                  )}
                </Button>
              )
            }
          />
        }
      </div>

      {/* ZK Passport Tutorial/QR Modal */}
      {showZkPassportTutorial &&
        (() => {
          const isPhone = getScreenType() === "phone";
          const hasUrl = !!zkPassportUrl;
          const showQR = hasUrl && !isPhone;
          const showStatus = hasUrl && isPhone;

          const handleCancel = () => {
            setIsZkPassportLoading(false);
            setShowZkPassportTutorial(false);
            setZkPassportUrl("");
            setZkPassportStatus(null);
          };

          const StatusDisplay = () =>
            zkPassportStatus ? (
              <div
                className={`w-full rounded-lg border bg-muted/50 p-4 ${showQR ? "mt-4" : ""}`}>
                <div className="flex items-center gap-2">
                  {isZkPassportLoading && (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  )}
                  <p className="text-muted-foreground text-sm">
                    {zkPassportStatus}
                  </p>
                </div>
              </div>
            ) : null;

          return (
            <Drawer
              open={showZkPassportTutorial}
              onOpenChange={(open) => {
                if (!open) {
                  handleCancel();
                }
              }}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {hasUrl
                      ? t("ZK_PASSPORT_VERIFICATION")
                      : t("ZK_PASSPORT_TUTORIAL_TITLE")}
                  </DrawerTitle>
                  {showQR && (
                    <DrawerDescription>
                      {t("ZK_PASSPORT_QR_DESCRIPTION")}
                    </DrawerDescription>
                  )}
                  {showStatus && (
                    <DrawerDescription>
                      {t("PLEASE_WAIT_WHILE_WE_VERIFY_YOUR", {
                        title: "Passport",
                      })}
                    </DrawerDescription>
                  )}
                  {!hasUrl && (
                    <DrawerDescription>
                      {t("ZK_PASSPORT_TUTORIAL_DESCRIPTION")}
                    </DrawerDescription>
                  )}
                </DrawerHeader>
                {showQR ? (
                  // QR Code View (Desktop/Tablet only)
                  <div className="flex flex-col items-center p-6">
                    <div className="mb-4 rounded-lg bg-white p-4">
                      <QRCodeSVG value={zkPassportUrl} size={200} />
                    </div>
                    <StatusDisplay />
                  </div>
                ) : showStatus ? (
                  // Status View (Mobile - after redirect)
                  <div className="flex flex-col items-center p-6">
                    <StatusDisplay />
                  </div>
                ) : (
                  // Tutorial View
                  <div className="flex flex-col gap-4 p-6">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="mb-2 font-semibold">
                        {t("ZK_PASSPORT_APP_REQUIRED")}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t("ZK_PASSPORT_APP_REQUIRED_DESCRIPTION")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isIOS() && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(ZK_PASSPORT_APP_LINKS.IOS, "_blank")
                          }
                          className="w-full">
                          {t("ZK_PASSPORT_DOWNLOAD_IOS")}
                        </Button>
                      )}
                      {isAndroid() && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(ZK_PASSPORT_APP_LINKS.ANDROID, "_blank")
                          }
                          className="w-full">
                          {t("ZK_PASSPORT_DOWNLOAD_ANDROID")}
                        </Button>
                      )}
                      {!isIOS() && !isAndroid() && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(ZK_PASSPORT_APP_LINKS.IOS, "_blank")
                            }
                            className="w-full">
                            {t("ZK_PASSPORT_DOWNLOAD_IOS")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(
                                ZK_PASSPORT_APP_LINKS.ANDROID,
                                "_blank",
                              )
                            }
                            className="w-full">
                            {t("ZK_PASSPORT_DOWNLOAD_ANDROID")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <DrawerFooter>
                  {hasUrl ? (
                    // Cancel button for QR/Status views
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="w-full">
                      {t("CANCEL")}
                    </Button>
                  ) : (
                    // Tutorial Footer
                    <>
                      <Button
                        onClick={handleZkPassportContinueToVerification}
                        disabled={isZkPassportLoading}
                        className="w-full">
                        {isZkPassportLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            {t("INITIALIZING")}
                          </>
                        ) : (
                          t("CONTINUE_TO_VERIFICATION")
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowZkPassportTutorial(false);
                        }}
                        className="w-full">
                        {t("CANCEL")}
                      </Button>
                    </>
                  )}
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          );
        })()}
    </>
  );
}

interface VerificationItemProps {
  name: SocialPlatformType;
  icon?: React.ReactNode;
  usdcReward: number;
  rpReward: number;
  isVerified: boolean;
  isStatusLoading: boolean;
  socialStatusError: Error | null;
  refetchSocialStatus: () => void;
  sessionId?: string;
  customButton?: React.ReactNode;
}

const reclaimConfig: Pick<
  ReclaimFlowParams,
  "appId" | "appSecret" | "providerIds"
> = {
  appId: RECLAIM_APP.APP_ID,
  appSecret: RECLAIM_APP.APP_SECRET,
  providerIds: DEFAULT_RECLAIM_PROVIDER_IDS,
};

function VerificationItem({
  name,
  icon,
  usdcReward,
  rpReward,
  isVerified,
  isStatusLoading,
  socialStatusError,
  refetchSocialStatus,
  sessionId,
  customButton,
}: VerificationItemProps) {
  const { t } = useTranslation();

  const { account } = useThirdweb();
  const { settings } = useSettings();
  const prices = usePrices();

  const { data: rpPerUsdtLimit } = useQuery({
    queryKey: ["rp-per-usdt-limit", settings.currency.currency],
    queryFn: async () => {
      return prices
        .getReputationPerUsdcLimit({ currency: settings.currency.currency })
        .match(
          (data) => data.multiplier,
          (error: unknown) => {
            console.error(
              "[VerificationItem] Error fetching RP/USDT limit",
              error,
            );
            return 1;
          },
        );
    },
  });

  const limit = rpReward * (rpPerUsdtLimit ?? 1);

  const [showVerificationOverlay, setShowVerificationOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Ref to track if polling is already in progress to prevent multiple executions
  const isPollingRef = useRef(false);
  const hasProcessedSessionRef = useRef(false);
  const overlayShownRef = useRef(false);
  const toastShownRef = useRef(false);

  const { mutateAsync: socialVerify, isPending: isSocialVerifyLoading } =
    useSocialVerify();

  const { track } = useAnalytics();

  useEffect(() => {
    if (isLoading && !overlayShownRef.current) {
      overlayShownRef.current = true;
      setShowVerificationOverlay(true);
    } else if (!isLoading) {
      overlayShownRef.current = false;
      setShowVerificationOverlay(false);
    }
  }, [isLoading]);

  const { isReachable } = useDomainReachability();

  useEffect(() => {
    if (isSocialVerifyLoading) {
      setIsLoading(true);
    }
  }, [isSocialVerifyLoading]);

  const handleContractCall = useCallback(
    async (reclaimResult: ReclaimProofResult) => {
      // Track contract call started
      track(EVENTS.VERIFICATION, {
        verification_type: "social",
        status: "contract_call_started",
        platform: name,
        userAddress: account?.address,
      });

      await socialVerify({
        _socialName: reclaimResult._socialName,
        proofs: reclaimResult.proofs as SocialVerifyParams["proofs"],
      })
        .then(() => {
          // Track successful completion
          track(EVENTS.VERIFICATION, {
            verification_type: "social",
            status: "completed",
            platform: name,
            userAddress: account?.address,
          });

          toast.success(t("VERIFICATION_SUCCESS"));
          if (typeof window !== "undefined" && window.location) {
            window.history.replaceState({}, document.title, "/limits");
          }
        })
        .catch((error) => {
          // Track contract call failure
          track(EVENTS.VERIFICATION, {
            verification_type: "social",
            status: "contract_call_failed",
            platform: name,
            userAddress: account?.address,
            errorMessage: error.message as string,
          });
          toast.error(
            t("VERIFICATION_FAILED_MESSAGE", {
              errorMessage: error.message as string,
            }),
          );
        });

      refetchSocialStatus();

      setIsLoading(false);
      setShowVerificationOverlay(false);
      overlayShownRef.current = false;
      // Clear stored parameters after successful contract call
      clearStoredParams();
      // Reset the processed session ref to allow future verifications
      hasProcessedSessionRef.current = false;
      // Reset toast ref for future verifications
      toastShownRef.current = false;
    },
    [name, socialVerify, refetchSocialStatus, track, account, t],
  );

  const loginToGetVerified = () => {
    toast.info("Connecting wallet...");
  };

  const handleVerificationSuccess = useCallback(
    async (reclaimResult: ReclaimProofResult) => {
      // Prevent multiple executions
      if (toastShownRef.current) {
        return;
      }

      if (name === "GitHub" && reclaimResult.proofs.length > 0) {
        const first = reclaimResult.proofs[0] as unknown as {
          publicData?: unknown;
        };
        const publicData = first?.publicData as
          | Record<string, unknown>
          | undefined;
        if (publicData && Object.keys(publicData).length === 0) {
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            setIsLoading(false);
            setShowVerificationOverlay(false);
            toast.warning(t("ELIGIBILITY_CRITERIA_NOT_MET"));
            // Clear stored parameters after verification failure
            clearStoredParams();
          }
          return;
        }
      }

      if (account) {
        toastShownRef.current = true;
        // Track proof received from Reclaim
        track(EVENTS.VERIFICATION, {
          verification_type: "social",
          status: "proof_received",
          platform: name,
          userAddress: account.address,
        });
        await handleContractCall(reclaimResult);
        // Clear stored parameters after successful verification
        clearStoredParams();
      }
    },
    [t, name, account, handleContractCall, track],
  );

  const clearVerification = useCallback(
    (message: string) => {
      // Determine status based on message
      const isCancelled =
        message.includes("CANCELLED") || message.includes("cancelled");
      const status = isCancelled ? "cancelled" : "failed";

      track(EVENTS.VERIFICATION, {
        verification_type: "social",
        status,
        platform: name,
        userAddress: account?.address,
        errorMessage: message,
      });

      toast.error(t("VERIFICATION_FAILED_MESSAGE", { errorMessage: message }));
      setIsLoading(false);
      setShowVerificationOverlay(false);
      clearStoredParams();

      if (typeof window !== "undefined" && window.location) {
        window.history.replaceState({}, document.title, "/limits");
      }
    },
    [track, name, account?.address, t],
  );

  const handleVerificationError = useCallback(
    (message: string) => {
      // Prevent multiple executions
      if (toastShownRef.current) {
        return;
      }

      toastShownRef.current = true;
      clearVerification(message);
    },
    [clearVerification],
  );

  const runReclaimFlow = useCallback(
    async (platform: SocialPlatform, existingSessionId?: string) => {
      if (!account?.address) {
        toast.error(t("PLEASE_LOGIN_TO_VERIFY_SOCIAL"));
        return;
      }

      const result = await createReclaimFlow({
        ...reclaimConfig,
        platform,
        walletAddress: account.address as `0x${string}`,
        redirectUrl: `${window.location.origin}/limits`,
        sessionId: existingSessionId,
        contextDescription: t("SOCIAL_VERIFICATION", { name }),
        onStatus: (status: ReclaimStatus) => {
          if (status.type === "session_created") {
            track(EVENTS.VERIFICATION, {
              verification_type: "social",
              status: "reclaim_flow_started",
              platform: name,
              userAddress: account.address,
              sessionId: status.sessionId,
            });
          }
        },
      });

      result.match(
        async (reclaimResult) => {
          await handleVerificationSuccess(reclaimResult);
        },
        (error) => {
          handleVerificationError(error.message);
        },
      );
    },
    [
      account?.address,
      name,
      t,
      track,
      handleVerificationSuccess,
      handleVerificationError,
    ],
  );

  useEffect(() => {
    // Only process sessionId once and when we have both sessionId and account
    if (sessionId && account?.address && !hasProcessedSessionRef.current) {
      hasProcessedSessionRef.current = true;
      setIsLoading(true);
      isPollingRef.current = true;
      runReclaimFlow(name.toLowerCase() as SocialPlatform, sessionId).finally(
        () => {
          isPollingRef.current = false;
        },
      );
    }
  }, [sessionId, account?.address, runReclaimFlow, name]);

  // Cleanup effect to reset refs when sessionId changes or component unmounts
  useEffect(() => {
    return () => {
      isPollingRef.current = false;
      hasProcessedSessionRef.current = false;
      overlayShownRef.current = false;
      toastShownRef.current = false;
    };
  }, []);

  const handleReclaimVerification = async () => {
    if (account?.address) {
      isPollingRef.current = true;
      await runReclaimFlow(name.toLowerCase() as SocialPlatform);
      isPollingRef.current = false;
    } else {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY_SOCIAL"));
    }
  };

  const handleVerifySocial = async () => {
    if (account?.address) {
      if (!showTutorial) {
        // Show tutorial if no socials are verified
        setShowTutorial(true);
        // Track tutorial shown
        track(EVENTS.VERIFICATION, {
          verification_type: "social",
          status: "tutorial_shown",
          platform: name,
          userAddress: account.address,
        });
        return;
      }

      setIsLoading(true);
      await handleReclaimVerification();
    } else {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY"));
    }
  };

  const handleContinueToVerification = async () => {
    setShowTutorial(false);
    // Track verification initiated when user continues from tutorial
    track(EVENTS.VERIFICATION, {
      verification_type: "social",
      status: "initiated",
      platform: name,
      userAddress: account?.address,
    });
    setIsLoading(true);
    await handleReclaimVerification();
  };

  return (
    <>
      {/* Verification In Progress Overlay */}
      {showVerificationOverlay ? (
        <Drawer
          open={showVerificationOverlay}
          onOpenChange={(open) => {
            if (!open) {
              clearVerification(t("VERIFICATION_CANCELLED"));
            }
          }}>
          <DrawerContent className="bg-background">
            <DrawerHeader>
              <DrawerTitle>{t("VERIFICATION_IN_PROGRESS")}</DrawerTitle>
              <DrawerDescription>
                {t("PLEASE_WAIT_WHILE_WE_VERIFY_YOUR", { title: name })}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex items-center justify-center p-6">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
            </div>
            <DrawerFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Track retry
                  track(EVENTS.VERIFICATION, {
                    verification_type: "social",
                    status: "retry",
                    platform: name,
                    userAddress: account?.address,
                  });
                  clearStoredParams();
                  // Also clear the URL to plain /limits after verification error
                  if (typeof window !== "undefined" && window.location) {
                    window.history.replaceState({}, document.title, "/limits");
                  }
                  handleReclaimVerification();
                }}>
                {t("RETRY_VERIFICATION")}
              </Button>
              <Button
                onClick={() => {
                  clearVerification(t("VERIFICATION_CANCELLED"));
                }}
                size="sm"
                className="w-full">
                {t("CANCEL_VERIFICATION")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
          <div className="relative w-[90%] max-w-md rounded-lg bg-background p-6">
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              onClick={() => setShowTutorial(false)}>
              ✕
            </Button>
            <h3 className="mb-4 font-bold text-xl">
              {t("HOW_TO_VERIFY_YOUR", { title: name })}
            </h3>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">
                  {getScreenType() === "desktop"
                    ? t("HOW_TO_VERIFY_YOUR_1_DESKTOP")
                    : isIOS()
                      ? t("HOW_TO_VERIFY_YOUR_1_IOS")
                      : t("HOW_TO_VERIFY_YOUR_1_ANDROID")}
                </p>
                <div className="flex justify-center">
                  {getScreenType() !== "desktop" ? (
                    <img
                      src={
                        isIOS()
                          ? ASSETS.IMAGES.APP_CLIP_CLICK_HERE
                          : ASSETS.IMAGES.INSTANT_APP_CLICK_HERE
                      }
                      alt="Verification step 1"
                      className="h-48 w-auto rounded-lg object-cover"
                    />
                  ) : null}
                </div>
                {isAndroid() && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(RECLAIM_APP_LINKS.ANDROID, "_blank")
                      }
                      className="w-full max-w-xs">
                      {t("RECLAIM_DOWNLOAD_ANDROID")}
                    </Button>
                  </div>
                )}
              </div>
              <p>{t("HOW_TO_VERIFY_YOUR_2", { title: name })}</p>
              <p>{t("HOW_TO_VERIFY_YOUR_4")}</p>
            </div>
            <Alert variant="warning" className="mt-4">
              <Clock4 className="size-4" />
              <AlertDescription>
                {t("VERIFICATION_DURATION_INFO")}
              </AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button
                onClick={handleContinueToVerification}
                className="w-full"
                disabled={isLoading}>
                {t("CONTINUE_TO_VERIFICATION")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="gap-4 bg-transparent py-4 transition-colors">
        <CardContent className="px-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/30">
                {icon}
              </div>
              <div className="flex flex-col items-start gap-1">
                <p className="font-medium text-lg">{name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="font-medium text-xs">
                <span className="font-semibold text-2xl">${limit}</span>{" "}
                {t("LIMIT")}
              </p>
              {usdcReward > 0 && (
                <p className="text-xs">
                  <span className="font-semibold">+{usdcReward}</span> USDC{" "}
                  {t("REWARD")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between px-4">
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            {name === "Aadhaar" ? <Monitor className="size-4" /> : null}
            {name === "Aadhaar"
              ? t("WORKS_ON_DEVICE_ONLY", {
                  device: "PC",
                })
              : null}
          </div>
          <div>
            {customButton ? (
              customButton
            ) : !account?.address ? (
              <Button variant="outline" onClick={() => loginToGetVerified()}>
                {t("LOGIN_TO_GET_VERIFIED_BUTTON")}
              </Button>
            ) : isStatusLoading ? (
              <Button disabled={true} onClick={() => {}}>
                <Loader2 className="size-4 animate-spin" />
                {t("LOADING")}
              </Button>
            ) : isLoading ? (
              <Button disabled={true} onClick={() => {}}>
                <Loader2 className="size-4 animate-spin" />
                {t("VERIFYING")}
              </Button>
            ) : isVerified ? (
              <Button
                className="bg-muted text-foreground hover:bg-muted"
                onClick={() => {
                  toast.success(t("ALREADY_VERIFIED"));
                }}>
                <Check className="mr-2 size-4" />
                {t("VERIFIED")}
              </Button>
            ) : !isReachable ? (
              <div className="flex items-center justify-center rounded-md bg-primary/70 px-4 py-2">
                <p className="text-center text-sm text-text-light">
                  {t("P2P_ME_UNREACHABLE")}
                </p>
              </div>
            ) : socialStatusError ? (
              <Button variant="outline" onClick={() => refetchSocialStatus()}>
                {t("RETRY")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleVerifySocial()}
                disabled={isLoading}>
                {t("GET_VERIFIED")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
