import { usePrices } from "@p2pdotme/sdk/react";
import {
  createLivenessFlow,
  createReclaimFlow,
  createSimpleKycFlow,
  type LivenessAttestation,
  type ReclaimFlowParams,
  type ReclaimLocale,
  type ReclaimProofResult,
  type ReclaimSession,
  type ReclaimStatus,
  resumeLivenessFlow,
  resumeSimpleKycFlow,
  type SimpleKycAttestation,
  type SocialPlatform,
  type SocialVerifyParams,
  type ZkkycError,
} from "@p2pdotme/sdk/zkkyc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
  ClipboardCheck,
  Clock4,
  Loader2,
  ScanFace,
  SmilePlus,
} from "lucide-react";
import type { ResultAsync } from "neverthrow";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { BvnVerificationCard } from "@/components/bvn-verification-card";
import { StatusCheckFailedAction } from "@/components/status-check-failed-action";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ROW_BTN,
  VerificationRow,
  VerifiedButton,
} from "@/components/verification-row";
import { useSettings } from "@/contexts";
import { useAnalytics } from "@/hooks";
import { useLowTrustGate } from "@/hooks/use-low-trust-gate";
import { useThirdweb } from "@/hooks/use-thirdweb";
import {
  useKycRpReward,
  useKycVerificationStatus,
  useLivenessRpReward,
  useLivenessVerificationStatus,
  useSocialRpRewards,
  useSocialVerificationStatus,
  useSocialVerify,
  useSubmitKycAttestation,
  useSubmitLivenessAttestation,
} from "@/hooks/use-tx-limits";
import { EVENTS } from "@/lib/analytics";
import {
  INTERNAL_HREFS,
  IS_BVN_ENABLED,
  KYC_COUNTRY_BY_CURRENCY,
  LIVENESS_BASE_URL,
  LIVENESS_EXCLUDED_COUNTRIES,
  LIVENESS_TENANT,
  LOW_TRUST_SOCIALS,
  RECLAIM_APP_LINKS,
  RECLAIM_BASE_URL,
  SIMPLE_KYC_BASE_URL,
  SIMPLE_KYC_TENANT,
} from "@/lib/constants";
import { refreshLimitsAfterVerification } from "@/lib/limit-increase";
import {
  clearStoredParams,
  getStoredParams,
} from "@/lib/url-param-preservation";
import {
  getUserFacingErrorMessage,
  isAlreadyVerifiedError,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { getScreenType, isAndroid, isIOS } from "@/lib/utils";
import { PrivacyBanner } from "./privacy-banner";

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
  | "Binance"
  | "Identity (KYC)"
  | "Liveness";

/**
 * Nudge line for the privacy banner on /limits: shown until the user has
 * verified any method, then renders nothing.
 */
export function VerifySocialCta() {
  const { t } = useTranslation();
  const {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
    isBinanceVerified,
  } = useSocialVerificationStatus();
  const { isKycVerified } = useKycVerificationStatus();
  const { isLivenessVerified } = useLivenessVerificationStatus();

  const isAnySocialVerified =
    !!isLinkedInVerified ||
    !!isGitHubVerified ||
    !!isXVerified ||
    !!isInstagramVerified ||
    !!isFacebookVerified ||
    !!isBinanceVerified ||
    !!isKycVerified ||
    !!isLivenessVerified;

  if (isAnySocialVerified) return null;

  return (
    <p className="mt-3 border-primary/10 border-t pt-3 text-[13px] text-muted-foreground leading-[18px]">
      {t("VERIFY_SOCIAL_TO_GROW_LIMITS")}
    </p>
  );
}

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

  const { settings } = useSettings();

  const {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
    isBinanceVerified,
    isSocialStatusLoading,
    isSocialStatusError,
    socialStatusError,
    refetchSocialStatus,
  } = useSocialVerificationStatus();

  // In India the low-trust methods are held back until the user holds a
  // high-trust proof; everywhere else this is always false.
  const { isLowTrustHidden } = useLowTrustGate();

  // Fetch RP rewards from contract
  const {
    linkedInRp,
    gitHubRp,
    instagramRp,
    xRp,
    facebookRp,
    binanceRp,
    isLoading: isRpLoading,
    isError: isRpError,
  } = useSocialRpRewards();

  // Fresh on-chain read for one platform, used right before (and after a
  // failed) socialVerify so a proof already landed from another tab/device
  // isn't submitted twice.
  const isSocialVerifiedOnChain = async (key: string) => {
    const result = await refetchSocialStatus();
    if (result.isError || !result.data) return false;
    return !!result.data[key as keyof typeof result.data];
  };

  const statusMap = {
    isLinkedInVerified,
    isGitHubVerified,
    isXVerified,
    isInstagramVerified,
    isFacebookVerified,
    isBinanceVerified,
  };

  // Map social names to contract reward values
  const socialRewards: Record<string, number | undefined> = {
    LinkedIn: linkedInRp,
    GitHub: gitHubRp,
    Instagram: instagramRp,
    X: xRp,
    Facebook: facebookRp,
    Binance: binanceRp,
  };

  const SOCIALS = [
    {
      name: "X" as SocialPlatformType,
      key: "isXVerified",
      icon: <ASSETS.ICONS.Twitter className="size-5 text-primary" />,
      rpReward: socialRewards.X ?? 0,
    },
    {
      name: "Instagram" as SocialPlatformType,
      key: "isInstagramVerified",
      icon: <ASSETS.ICONS.Instagram className="size-5 text-primary" />,
      rpReward: socialRewards.Instagram ?? 0,
    },
    {
      name: "Facebook" as SocialPlatformType,
      key: "isFacebookVerified",
      icon: <ASSETS.ICONS.Facebook className="size-5 text-primary" />,
      rpReward: socialRewards.Facebook ?? 0,
    },
    {
      name: "LinkedIn" as SocialPlatformType,
      key: "isLinkedInVerified",
      icon: <ASSETS.ICONS.Linkedin className="size-5 text-primary" />,
      rpReward: socialRewards.LinkedIn ?? 0,
    },
    {
      name: "GitHub" as SocialPlatformType,
      key: "isGitHubVerified",
      icon: <ASSETS.ICONS.Github className="size-5 text-primary" />,
      rpReward: socialRewards.GitHub ?? 0,
    },
    {
      name: "Binance" as SocialPlatformType,
      key: "isBinanceVerified",
      icon: <ASSETS.ICONS.Binance className="size-5 text-primary" />,
      rpReward: socialRewards.Binance ?? 0,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <PrivacyBanner
        title={t("VERIFICATIONS_PRIVATE_TITLE")}
        description={t("VERIFICATIONS_PRIVATE_DESCRIPTION")}
      />
      {SOCIALS.filter((social) => {
        // Binance verification is not offered when the selected country is India
        if (
          social.name === "Binance" &&
          settings.currency.country === "India"
        ) {
          return false;
        }
        // India ranks the low-trust methods behind a high-trust one, so they
        // stay hidden until Identity/KYC, LinkedIn or GitHub is verified.
        if (isLowTrustHidden && LOW_TRUST_SOCIALS.includes(social.name)) {
          return false;
        }
        return true;
      }).map((social) => (
        <VerificationItem
          key={social.name}
          name={social.name}
          icon={social.icon}
          rpReward={isRpLoading || isRpError ? 0 : social.rpReward}
          isVerified={
            isSocialStatusError
              ? false
              : !!statusMap[social.key as keyof typeof statusMap]
          }
          isStatusLoading={isSocialStatusLoading}
          socialStatusError={socialStatusError}
          refetchSocialStatus={refetchSocialStatus}
          isVerifiedOnChain={() => isSocialVerifiedOnChain(social.key)}
          sessionId={
            socialPlatform && socialPlatform === social.name
              ? sessionId || undefined
              : undefined
          }
        />
      ))}
      {IS_BVN_ENABLED && settings.currency.currency === "NGN" && (
        <BvnVerificationCard />
      )}
    </div>
  );
}

interface VerificationItemProps {
  name: SocialPlatformType;
  /** Translated row title; defaults to `name` (brand names aren't translated). */
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  rpReward: number;
  isVerified: boolean;
  isStatusLoading: boolean;
  socialStatusError: Error | null;
  refetchSocialStatus: () => void;
  /** Re-reads the on-chain status for this method; true when verified. */
  isVerifiedOnChain?: () => Promise<boolean>;
  sessionId?: string;
  customButton?: React.ReactNode;
}

/** Overall cap on one Reclaim attempt before we stop polling. */
const RECLAIM_SESSION_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Reclaim session ids whose proof this page already handed to socialVerify.
 * Module scope so a remount (or a URL/stored-params replay of the same
 * sessionId) can never submit the same proof twice.
 */
const submittedReclaimSessions = new Set<string>();

const reclaimConfig: Pick<ReclaimFlowParams, "sessionEndpoint" | "tenant"> = {
  sessionEndpoint: RECLAIM_BASE_URL,
  tenant: "p2p",
};

const RECLAIM_LOCALES: readonly ReclaimLocale[] = [
  "en",
  "es",
  "hi",
  "id",
  "pt",
];

/**
 * The message shown inside the Reclaim Verifier app is rendered by the session
 * service, not here — it appears under our app identity, so the service owns the
 * wording and the client only picks a language.
 */
function toReclaimLocale(language: string): ReclaimLocale {
  const base = language.slice(0, 2).toLowerCase() as ReclaimLocale;
  return RECLAIM_LOCALES.includes(base) ? base : "en";
}

function VerificationItem({
  name,
  title,
  description,
  icon,
  rpReward,
  isVerified,
  isStatusLoading,
  socialStatusError,
  refetchSocialStatus,
  isVerifiedOnChain,
  sessionId,
  customButton,
}: VerificationItemProps) {
  const { t, i18n } = useTranslation();

  const { account } = useThirdweb();
  const { settings } = useSettings();
  const prices = usePrices();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

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
  // True while a Reclaim session is being preloaded; gates the Continue tap so
  // it only fires once the session is ready, keeping the trigger inside the tap.
  const [isPreloading, setIsPreloading] = useState(false);
  // Set when an attempt ran past RECLAIM_SESSION_TIMEOUT_MS and was stopped.
  const [sessionExpired, setSessionExpired] = useState(false);

  // Ref to track if polling is already in progress to prevent multiple executions
  const isPollingRef = useRef(false);
  // The URL/stored sessionId this card already resumed. Keyed by id (not a
  // boolean that gets reset) so a re-render after the URL is cleared can't
  // resume — and re-submit — the same session.
  const processedSessionIdRef = useRef<string | null>(null);
  const overlayShownRef = useRef(false);
  const toastShownRef = useRef(false);
  // A Reclaim session initialized off-gesture (during the tutorial) so the tap
  // that starts verification can call triggerReclaimFlow synchronously.
  const preloadedSessionRef = useRef<ReclaimSession | null>(null);
  const preloadingRef = useRef(false);
  // The session currently polling, so Cancel / Retry / unmount can abort it.
  const activeSessionRef = useRef<ReclaimSession | null>(null);
  // Bumped whenever an attempt is started or abandoned; a result that arrives
  // for an older attempt (e.g. a proof landing after Cancel) is ignored.
  const attemptRef = useRef(0);
  const expiryTimerRef = useRef<number | null>(null);

  const { mutateAsync: socialVerify, isPending: isSocialVerifyLoading } =
    useSocialVerify();

  const { track } = useAnalytics();
  // Retry action for failure toasts; points at handleVerifySocial once it is
  // defined below (the toasts are raised from callbacks declared earlier).
  const retryRef = useRef<() => void>(() => {});

  // Drop ?sessionId=…&socialPlatform=… through the router so its location
  // stays in sync (window.history.replaceState bypasses it).
  const clearUrlParams = useCallback(() => {
    const { pathname, search } = locationRef.current;
    if (search) navigate(pathname, { replace: true });
  }, [navigate]);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current !== null) {
      window.clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  // Stops the polling attempt (if any) and invalidates its callbacks.
  const stopActiveSession = useCallback(() => {
    attemptRef.current += 1;
    activeSessionRef.current?.abort?.();
    activeSessionRef.current = null;
    clearExpiryTimer();
    isPollingRef.current = false;
  }, [clearExpiryTimer]);

  useEffect(() => {
    if (isLoading && !overlayShownRef.current) {
      overlayShownRef.current = true;
      setShowVerificationOverlay(true);
    } else if (!isLoading) {
      overlayShownRef.current = false;
      setShowVerificationOverlay(false);
    }
  }, [isLoading]);

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

      const checkVerifiedNow = async () =>
        isVerifiedOnChain ? isVerifiedOnChain().catch(() => false) : false;

      const onVerified = (skippedTx: boolean) => {
        // Track successful completion
        track(EVENTS.VERIFICATION, {
          verification_type: "social",
          status: "completed",
          platform: name,
          userAddress: account?.address,
          ...(skippedTx ? { skippedTx: true } : {}),
        });
        toast.success(t("VERIFICATION_SUCCESS"));
        refreshLimitsAfterVerification(queryClient);
        clearUrlParams();
      };

      try {
        // Another tab/device may have already submitted this platform's proof
        // (e.g. the PWA and a browser tab both polled the same session).
        if (await checkVerifiedNow()) {
          onVerified(true);
        } else {
          await socialVerify({
            _socialName: reclaimResult._socialName,
            proofs: reclaimResult.proofs as SocialVerifyParams["proofs"],
          });
          onVerified(false);
        }
      } catch (error) {
        if (isAlreadyVerifiedError(error) && (await checkVerifiedNow())) {
          // Lost the race to the other tab, but this wallet is verified.
          onVerified(true);
        } else {
          // Track contract call failure
          track(EVENTS.VERIFICATION, {
            verification_type: "social",
            status: "contract_call_failed",
            platform: name,
            userAddress: account?.address,
            errorMessage: error instanceof Error ? error.message : undefined,
          });
          if (isUserCancellation(error)) {
            toast(t("VERIFICATION_CANCELLED"));
          } else {
            toast.error(t("VERIFICATION_FAILED"), {
              description: getUserFacingErrorMessage(
                t,
                error,
                "LIM_VERIFICATION_FAILED_DESCRIPTION",
              ),
              // Retrying can't help an account that is already used.
              ...(isAlreadyVerifiedError(error)
                ? {}
                : {
                    action: {
                      label: t("RETRY"),
                      onClick: () => retryRef.current(),
                    },
                  }),
            });
          }
        }
      }

      refetchSocialStatus();

      setIsLoading(false);
      setShowVerificationOverlay(false);
      overlayShownRef.current = false;
      // Clear stored parameters after the contract call
      clearStoredParams();
      // Reset toast ref for future verifications
      toastShownRef.current = false;
    },
    [
      name,
      socialVerify,
      refetchSocialStatus,
      isVerifiedOnChain,
      track,
      account,
      t,
      queryClient,
      clearUrlParams,
    ],
  );

  const loginToGetVerified = () => {
    toast.info(t("CONNECTING_WALLET"));
  };

  const handleVerificationSuccess = useCallback(
    async (reclaimResult: ReclaimProofResult) => {
      // Prevent multiple executions
      if (toastShownRef.current) {
        return;
      }

      // Never hand the same proof to socialVerify twice.
      if (
        reclaimResult.sessionId &&
        submittedReclaimSessions.has(reclaimResult.sessionId)
      ) {
        setIsLoading(false);
        setShowVerificationOverlay(false);
        clearStoredParams();
        clearUrlParams();
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
        if (reclaimResult.sessionId) {
          submittedReclaimSessions.add(reclaimResult.sessionId);
        }
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
    [t, name, account, handleContractCall, track, clearUrlParams],
  );

  const clearVerification = useCallback(
    (message: string, cancelledByUser = false) => {
      // Determine status based on message
      const isCancelled =
        cancelledByUser ||
        message.includes("CANCELLED") ||
        message.includes("cancelled") ||
        isUserCancellation(message);
      const status = isCancelled ? "cancelled" : "failed";

      track(EVENTS.VERIFICATION, {
        verification_type: "social",
        status,
        platform: name,
        userAddress: account?.address,
        errorMessage: message,
      });

      // Never surface the raw Reclaim / RPC message: a cancel is neutral, a
      // failure gets a plain reason and a one-tap retry (unless retrying
      // can't help because the account is already used).
      if (isCancelled) {
        toast(t("VERIFICATION_CANCELLED"));
      } else {
        toast.error(t("VERIFICATION_FAILED"), {
          description: getUserFacingErrorMessage(
            t,
            message,
            "LIM_VERIFICATION_FAILED_DESCRIPTION",
          ),
          ...(isAlreadyVerifiedError(message)
            ? {}
            : {
                action: {
                  label: t("RETRY"),
                  onClick: () => retryRef.current(),
                },
              }),
        });
      }
      setIsLoading(false);
      setShowVerificationOverlay(false);
      clearStoredParams();
      clearUrlParams();
    },
    [track, name, account?.address, t, clearUrlParams],
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

  // Starts a new attempt: aborts any previous one and arms the overall
  // timeout. Synchronous, so it can run inside the user's tap.
  const beginAttempt = useCallback(() => {
    stopActiveSession();
    const attempt = attemptRef.current;
    expiryTimerRef.current = window.setTimeout(() => {
      expiryTimerRef.current = null;
      if (attemptRef.current !== attempt) return;
      stopActiveSession();
      track(EVENTS.VERIFICATION, {
        verification_type: "social",
        status: "expired",
        platform: name,
        userAddress: account?.address,
      });
      setIsLoading(false);
      setShowVerificationOverlay(false);
      overlayShownRef.current = false;
      toastShownRef.current = false;
      clearStoredParams();
      clearUrlParams();
      setSessionExpired(true);
    }, RECLAIM_SESSION_TIMEOUT_MS);
    return attempt;
  }, [stopActiveSession, track, name, account?.address, clearUrlParams]);

  // Polls `session` for this attempt; results for a stale attempt are dropped
  // so a proof arriving after Cancel never submits a transaction.
  const pollSession = useCallback(
    (session: ReclaimSession, attempt: number) => {
      activeSessionRef.current = session;
      return session.start().match(
        async (reclaimResult) => {
          if (attemptRef.current !== attempt) return;
          clearExpiryTimer();
          activeSessionRef.current = null;
          await handleVerificationSuccess(reclaimResult);
        },
        (error) => {
          if (attemptRef.current !== attempt) return;
          clearExpiryTimer();
          activeSessionRef.current = null;
          handleVerificationError(error.message);
        },
      );
    },
    [clearExpiryTimer, handleVerificationSuccess, handleVerificationError],
  );

  const runReclaimFlow = useCallback(
    async (
      platform: SocialPlatform,
      attempt: number,
      existingSessionId?: string,
    ) => {
      if (!account?.address) {
        toast.error(t("PLEASE_LOGIN_TO_VERIFY_SOCIAL"));
        return;
      }

      const sessionResult = await createReclaimFlow({
        ...reclaimConfig,
        platform,
        walletAddress: account.address as `0x${string}`,
        redirectUrl: `${window.location.origin}${INTERNAL_HREFS.LIMITS_ZK_KYC}`,
        sessionId: existingSessionId,
        locale: toReclaimLocale(i18n.language),
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

      // The SDK split the Reclaim flow into eager init + start():
      // createReclaimFlow now resolves to a session, and session.start()
      // runs the in-app flow and resolves the proof result.
      await sessionResult.match(
        async (session) => {
          if (attemptRef.current !== attempt) {
            session.abort();
            return;
          }
          await pollSession(session, attempt);
        },
        (error) => {
          if (attemptRef.current !== attempt) return;
          clearExpiryTimer();
          handleVerificationError(error.message);
        },
      );
    },
    [
      account?.address,
      name,
      t,
      i18n.language,
      track,
      pollSession,
      clearExpiryTimer,
      handleVerificationError,
    ],
  );

  // Init a Reclaim session ahead of the user's tap. init()/getRequestUrl() are
  // network calls that need no user-activation, so running them off-gesture lets
  // the later trigger fire synchronously inside the tap.
  const preloadReclaimSession = useCallback(async () => {
    if (!account?.address) return;
    if (preloadingRef.current || preloadedSessionRef.current) return;
    preloadingRef.current = true;
    setIsPreloading(true);
    try {
      const sessionResult = await createReclaimFlow({
        ...reclaimConfig,
        platform: name.toLowerCase() as SocialPlatform,
        walletAddress: account.address as `0x${string}`,
        redirectUrl: `${window.location.origin}${INTERNAL_HREFS.LIMITS_ZK_KYC}`,
        locale: toReclaimLocale(i18n.language),
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
      sessionResult.match(
        (session) => {
          preloadedSessionRef.current = session;
        },
        () => {
          preloadedSessionRef.current = null;
        },
      );
    } finally {
      preloadingRef.current = false;
      setIsPreloading(false);
    }
  }, [account?.address, name, i18n.language, track]);

  // Starts verification from within the user's tap. iOS only grants the
  // deep-link / clipboard launch its transient user-activation when
  // triggerReclaimFlow runs with no await between the tap and the call, so we
  // consume the preloaded session and call session.start() synchronously here.
  const startPreloadedFlow = useCallback(() => {
    if (!account?.address) {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY_SOCIAL"));
      return;
    }
    setSessionExpired(false);
    const attempt = beginAttempt();
    const session = preloadedSessionRef.current;
    if (!session) {
      // Preload not ready yet — fall back to init-on-tap. Works, but loses the
      // iOS user-activation optimization for this attempt.
      isPollingRef.current = true;
      setIsLoading(true);
      void runReclaimFlow(
        name.toLowerCase() as SocialPlatform,
        attempt,
      ).finally(() => {
        if (attemptRef.current === attempt) isPollingRef.current = false;
      });
      return;
    }
    preloadedSessionRef.current = null;
    // No await before this line — keeps the tap's user-activation intact.
    const flow = pollSession(session, attempt);
    isPollingRef.current = true;
    setIsLoading(true);
    void flow.finally(() => {
      if (attemptRef.current === attempt) isPollingRef.current = false;
    });
    // Prepare a fresh session for a possible retry.
    void preloadReclaimSession();
  }, [
    account?.address,
    name,
    t,
    beginAttempt,
    pollSession,
    runReclaimFlow,
    preloadReclaimSession,
  ]);

  useEffect(() => {
    // Only process each sessionId once, and only when we have an account
    if (
      sessionId &&
      account?.address &&
      processedSessionIdRef.current !== sessionId
    ) {
      processedSessionIdRef.current = sessionId;
      setIsLoading(true);
      const attempt = beginAttempt();
      isPollingRef.current = true;
      runReclaimFlow(
        name.toLowerCase() as SocialPlatform,
        attempt,
        sessionId,
      ).finally(() => {
        if (attemptRef.current === attempt) isPollingRef.current = false;
      });
    }
  }, [sessionId, account?.address, runReclaimFlow, beginAttempt, name]);

  // Stop polling and reset refs when the component unmounts
  useEffect(() => {
    return () => {
      // A URL session that was still polling may be resumed by a remount
      // (StrictMode, or coming back); submittedReclaimSessions still blocks
      // a second submit of the same proof.
      if (isPollingRef.current) processedSessionIdRef.current = null;
      stopActiveSession();
      preloadedSessionRef.current?.abort?.();
      isPollingRef.current = false;
      overlayShownRef.current = false;
      toastShownRef.current = false;
      preloadedSessionRef.current = null;
    };
  }, [stopActiveSession]);

  const handleVerifySocial = () => {
    if (account?.address) {
      if (!showTutorial) {
        // Show the tutorial first, and preload the Reclaim session while the
        // user reads it so the Continue tap can trigger synchronously.
        setShowTutorial(true);
        // Track tutorial shown
        track(EVENTS.VERIFICATION, {
          verification_type: "social",
          status: "tutorial_shown",
          platform: name,
          userAddress: account.address,
        });
        void preloadReclaimSession();
        return;
      }

      startPreloadedFlow();
    } else {
      toast.error(t("PLEASE_LOGIN_TO_VERIFY"));
    }
  };

  useEffect(() => {
    retryRef.current = () => {
      // Never leave an earlier attempt polling behind a new one.
      stopActiveSession();
      setSessionExpired(false);
      setShowTutorial(false);
      track(EVENTS.VERIFICATION, {
        verification_type: "social",
        status: "retry",
        platform: name,
        userAddress: account?.address,
      });
      // A failed attempt leaves this latched, which would swallow the next
      // attempt's result.
      toastShownRef.current = false;
      // Re-opens the tutorial and preloads a fresh session.
      if (account?.address) {
        setShowTutorial(true);
        void preloadReclaimSession();
      } else {
        toast.error(t("PLEASE_LOGIN_TO_VERIFY"));
      }
    };
  });

  const handleContinueToVerification = () => {
    setShowTutorial(false);
    // Track verification initiated when user continues from tutorial
    track(EVENTS.VERIFICATION, {
      verification_type: "social",
      status: "initiated",
      platform: name,
      userAddress: account?.address,
    });
    startPreloadedFlow();
  };

  const cancelVerification = () => {
    stopActiveSession();
    clearVerification(t("VERIFICATION_CANCELLED"), true);
  };

  return (
    <>
      {/* Verification In Progress Overlay */}
      {showVerificationOverlay ? (
        <Drawer
          open={showVerificationOverlay}
          onOpenChange={(open) => {
            if (!open) {
              cancelVerification();
            }
          }}>
          <DrawerContent className="bg-background">
            <DrawerHeader>
              <DrawerTitle>{t("VERIFICATION_IN_PROGRESS")}</DrawerTitle>
              <DrawerDescription>
                {t("PLEASE_WAIT_WHILE_WE_VERIFY_YOUR", {
                  title: title ?? name,
                })}
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
                  // Abort the current poll before starting a new one.
                  stopActiveSession();
                  clearStoredParams();
                  // Also clear the URL to plain /limits after verification error
                  clearUrlParams();
                  startPreloadedFlow();
                }}>
                {t("RETRY_VERIFICATION")}
              </Button>
              <Button onClick={cancelVerification} size="sm" className="w-full">
                {t("CANCEL_VERIFICATION")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}

      {sessionExpired ? (
        <Drawer
          open={sessionExpired}
          onOpenChange={(open) => {
            if (!open) setSessionExpired(false);
          }}>
          <DrawerContent className="bg-background">
            <DrawerHeader>
              <DrawerTitle>{t("VFX_SESSION_EXPIRED_TITLE")}</DrawerTitle>
              <DrawerDescription>
                {t("VFX_SESSION_EXPIRED_DESCRIPTION")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button className="w-full" onClick={() => retryRef.current()}>
                {t("VFX_START_AGAIN")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSessionExpired(false)}>
                {t("CLOSE")}
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
                {isIOS() && (
                  <p className="flex items-center gap-1 font-medium text-primary text-xs">
                    <ClipboardCheck className="size-3.5 shrink-0" />
                    {t("RECLAIM_IOS_ALLOW_PASTE")}
                  </p>
                )}
                <div className="flex justify-center">
                  {getScreenType() !== "desktop" ? (
                    <img
                      src={
                        isIOS()
                          ? ASSETS.IMAGES.IOS_RECLAIM_VERIFIER
                          : ASSETS.IMAGES.INSTANT_APP_CLICK_HERE
                      }
                      alt={t("VERIFICATION_STEP_1_ALT")}
                      className="h-48 w-auto rounded-lg object-cover"
                    />
                  ) : null}
                </div>
                {(isAndroid() || isIOS()) && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          isIOS()
                            ? RECLAIM_APP_LINKS.IOS
                            : RECLAIM_APP_LINKS.ANDROID,
                          "_blank",
                        )
                      }
                      className="w-full max-w-xs">
                      {isIOS()
                        ? t("RECLAIM_DOWNLOAD_IOS")
                        : t("RECLAIM_DOWNLOAD_ANDROID")}
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
                disabled={isLoading || isPreloading}>
                {isPreloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("LOADING")}
                  </>
                ) : (
                  t("CONTINUE_TO_VERIFICATION")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <VerificationRow
        icon={icon}
        title={title ?? name}
        limit={limit}
        description={description}
        action={
          customButton ? (
            customButton
          ) : !account?.address ? (
            <Button
              variant="outline"
              className={ROW_BTN}
              onClick={() => loginToGetVerified()}>
              {t("LOGIN_TO_GET_VERIFIED_BUTTON")}
            </Button>
          ) : isStatusLoading ? (
            <Button className={ROW_BTN} disabled={true} onClick={() => {}}>
              <Loader2 className="size-4 animate-spin" />
              {t("LOADING")}
            </Button>
          ) : isLoading ? (
            <Button className={ROW_BTN} disabled={true} onClick={() => {}}>
              <Loader2 className="size-4 animate-spin" />
              {t("VERIFYING")}
            </Button>
          ) : isVerified ? (
            <VerifiedButton />
          ) : socialStatusError ? (
            <StatusCheckFailedAction onRetry={() => refetchSocialStatus()} />
          ) : (
            <Button
              variant="outline"
              className={ROW_BTN}
              onClick={() => handleVerifySocial()}
              disabled={isLoading}>
              {t("GET_VERIFIED")}
            </Button>
          )
        }
      />
    </>
  );
}

/**
 * Failure toast for the hosted (redirect) verifications: a plain-language
 * reason plus a Retry action, never the raw service / RPC message. A user
 * cancelling is not a failure and gets a neutral note instead, and an account
 * that is already used gets the reason without Retry (retrying can't help).
 */
function showHostedVerificationFailure(
  t: TFunction,
  title: string,
  error: unknown,
  onRetry: () => void,
) {
  if (isUserCancellation(error)) {
    toast(t("VERIFICATION_CANCELLED"));
    return;
  }
  toast.error(title, {
    description: getUserFacingErrorMessage(
      t,
      error,
      "LIM_VERIFICATION_FAILED_DESCRIPTION",
    ),
    ...(isAlreadyVerifiedError(error)
      ? {}
      : { action: { label: t("RETRY"), onClick: onRetry } }),
  });
}

type HostedKind = "liveness" | "kyc";
// Liveness and simple-kyc attestations share one shape.
type HostedAttestation = LivenessAttestation | SimpleKycAttestation;

/**
 * A redeemed attestation that hasn't landed on-chain yet. The one-time `code`
 * is spent once redeemed, so if the submit fails or the page reloads this is
 * the only copy — keep it until the submit succeeds or the status reads
 * verified.
 */
function pendingAttestationKey(kind: HostedKind, address: string) {
  return `@P2PME:PENDING_ATTESTATION:${kind}:${address.toLowerCase()}`;
}

function savePendingAttestation(
  kind: HostedKind,
  address: string,
  att: HostedAttestation,
) {
  try {
    localStorage.setItem(
      pendingAttestationKey(kind, address),
      JSON.stringify({
        nullifier: att.nullifier,
        limit: att.limit.toString(),
        expiry: att.expiry.toString(),
        signature: att.signature,
        identityHash: att.identityHash,
      }),
    );
  } catch {
    // Storage unavailable (private mode / quota): the in-memory copy still
    // drives this session's submit and Finish action.
  }
}

function readPendingAttestation(
  kind: HostedKind,
  address: string,
): HostedAttestation | null {
  try {
    const raw = localStorage.getItem(pendingAttestationKey(kind, address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.nullifier !== "string" ||
      typeof parsed.signature !== "string" ||
      typeof parsed.limit !== "string" ||
      typeof parsed.expiry !== "string"
    ) {
      return null;
    }
    return {
      nullifier: parsed.nullifier as `0x${string}`,
      signature: parsed.signature as `0x${string}`,
      limit: BigInt(parsed.limit),
      expiry: BigInt(parsed.expiry),
      ...(typeof parsed.identityHash === "string"
        ? { identityHash: parsed.identityHash }
        : {}),
    };
  } catch {
    return null;
  }
}

function clearPendingAttestation(kind: HostedKind, address: string) {
  try {
    localStorage.removeItem(pendingAttestationKey(kind, address));
  } catch {
    // ignore
  }
}

/** `expiry` is unix seconds; leave a small margin for the tx to land. */
function isAttestationExpired(att: HostedAttestation) {
  if (att.expiry <= 0n) return false;
  return att.expiry <= BigInt(Math.floor(Date.now() / 1000) + 60);
}

interface HostedVerificationConfig {
  kind: HostedKind;
  isVerified: boolean | undefined;
  refetchStatus: () => Promise<{ data?: boolean; isError: boolean }>;
  submitAttestation: (att: HostedAttestation) => Promise<unknown>;
  resume: (code: string) => ResultAsync<HostedAttestation, ZkkycError>;
  /** Creates the hosted-wizard session, or returns null to abort the start. */
  createSession: (
    address: `0x${string}`,
  ) => ResultAsync<{ redirect: () => void }, ZkkycError> | null;
  startTrackExtra?: Record<string, unknown>;
  failedTitleKey: string;
  verifyingKey: string;
  successKey: string;
}

/**
 * Shared redirect flow for the liveness and passport-KYC cards:
 * start → hosted wizard → return with `?code&state=<kind>-…` → redeem the code
 * into an attestation (persisted until it lands) → submit on-chain.
 */
function useHostedVerification({
  kind,
  isVerified,
  refetchStatus,
  submitAttestation,
  resume,
  createSession,
  startTrackExtra,
  failedTitleKey,
  verifyingKey,
  successKey,
}: HostedVerificationConfig) {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { track } = useAnalytics();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const address = account?.address;
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<HostedAttestation | null>(null);
  const processed = useRef(false);
  // Retry actions for failure toasts raised before the callbacks are declared.
  const startRef = useRef<() => void>(() => {});
  const finishRef = useRef<() => void>(() => {});

  // Pick up an attestation a previous visit redeemed but never landed.
  useEffect(() => {
    if (!address) {
      setPending(null);
      return;
    }
    const stored = readPendingAttestation(kind, address);
    if (stored && isAttestationExpired(stored)) {
      clearPendingAttestation(kind, address);
      setPending(null);
      toast.info(t("VFX_ATTESTATION_EXPIRED"));
      return;
    }
    setPending(stored);
  }, [address, kind, t]);

  // Once the chain says verified, the stored copy has done its job.
  useEffect(() => {
    if (isVerified && address) {
      clearPendingAttestation(kind, address);
      setPending(null);
    }
  }, [isVerified, address, kind]);

  // Back from the hosted wizard restores this page from the bfcache with
  // `busy` still set from before the redirect.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const submitStored = useCallback(
    async (att: HostedAttestation) => {
      if (!address) return;
      if (isAttestationExpired(att)) {
        clearPendingAttestation(kind, address);
        setPending(null);
        toast.info(t("VFX_ATTESTATION_EXPIRED"));
        return;
      }
      setBusy(true);
      const toastId = toast.loading(t(verifyingKey));
      const onVerified = async () => {
        clearPendingAttestation(kind, address);
        setPending(null);
        toast.success(t(successKey), { id: toastId });
        track(EVENTS.VERIFICATION, {
          verification_type: kind,
          status: "completed",
        });
        refreshLimitsAfterVerification(queryClient);
        await refetchStatus();
      };
      try {
        await submitAttestation(att);
        await onVerified();
      } catch (error) {
        if (isAlreadyVerifiedError(error)) {
          const fresh = await refetchStatus().catch(() => null);
          if (fresh && !fresh.isError && fresh.data) {
            // Already landed (e.g. an earlier submit we lost track of).
            await onVerified();
            return;
          }
          // Used by another wallet: resubmitting can never succeed.
          clearPendingAttestation(kind, address);
          setPending(null);
        }
        toast.dismiss(toastId);
        track(EVENTS.VERIFICATION, {
          verification_type: kind,
          status: "failed",
          stage: "submit",
          errorMessage: error instanceof Error ? error.message : undefined,
        });
        showHostedVerificationFailure(t, t(failedTitleKey), error, () =>
          finishRef.current(),
        );
      } finally {
        setBusy(false);
      }
    },
    [
      address,
      kind,
      t,
      verifyingKey,
      successKey,
      failedTitleKey,
      track,
      queryClient,
      refetchStatus,
      submitAttestation,
    ],
  );

  // Retry after a submit failure resubmits the stored attestation; only with
  // nothing stored does it fall back to a fresh wizard.
  finishRef.current = () => {
    const stored =
      pending ?? (address ? readPendingAttestation(kind, address) : null);
    if (stored) void submitStored(stored);
    else startRef.current();
  };

  // Returning from the hosted wizard: ?code=<one-time>&state=<kind>-…
  useEffect(() => {
    if (processed.current || !address) return;
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state || !state.startsWith(kind)) return;
    processed.current = true;
    const pathname = location.pathname;
    // Through the router (not history.replaceState) so its location stays in
    // sync; `processed` keeps the re-run from redeeming twice.
    const clearUrl = () => navigate(pathname, { replace: true });
    track(EVENTS.VERIFICATION, {
      verification_type: kind,
      status: "returned",
    });
    (async () => {
      setBusy(true);
      const att = await resume(code);
      if (att.isErr()) {
        track(EVENTS.VERIFICATION, {
          verification_type: kind,
          status: "failed",
          stage: "resume",
          errorMessage: att.error.message,
        });
        clearUrl();
        showHostedVerificationFailure(t, t(failedTitleKey), att.error, () =>
          startRef.current(),
        );
        setBusy(false);
        return;
      }
      // The code is spent: persist the attestation before anything else can
      // fail, and drop the code so a reload doesn't try to redeem it again.
      savePendingAttestation(kind, address, att.value);
      setPending(att.value);
      clearUrl();
      await submitStored(att.value);
    })();
  }, [
    address,
    kind,
    location.search,
    location.pathname,
    navigate,
    resume,
    submitStored,
    failedTitleKey,
    t,
    track,
  ]);

  const start = useCallback(async () => {
    if (!address) {
      toast.error(t("CONNECT_WALLET_FIRST"));
      return;
    }
    const sessionResult = createSession(address as `0x${string}`);
    if (!sessionResult) return;
    track(EVENTS.VERIFICATION, {
      verification_type: kind,
      status: "started",
      ...startTrackExtra,
    });
    setBusy(true);
    const session = await sessionResult;
    if (session.isErr()) {
      track(EVENTS.VERIFICATION, {
        verification_type: kind,
        status: "failed",
        stage: "session",
        errorMessage: session.error.message,
      });
      showHostedVerificationFailure(t, t(failedTitleKey), session.error, () =>
        startRef.current(),
      );
      setBusy(false);
      return;
    }
    track(EVENTS.VERIFICATION, {
      verification_type: kind,
      status: "redirected",
    });
    session.value.redirect();
  }, [address, createSession, kind, startTrackExtra, failedTitleKey, t, track]);
  startRef.current = start;

  return {
    busy,
    pending,
    start,
    finish: () => finishRef.current(),
  };
}

/** Row action shared by the liveness and KYC cards. */
function HostedVerificationButton({
  isVerified,
  isStatusLoading,
  statusError,
  onRetryStatus,
  busy,
  hasPending,
  onStart,
  onFinish,
}: {
  isVerified: boolean;
  isStatusLoading: boolean;
  statusError: Error | null;
  onRetryStatus: () => void;
  busy: boolean;
  hasPending: boolean;
  onStart: () => void;
  onFinish: () => void;
}) {
  const { t } = useTranslation();
  if (isVerified) return <VerifiedButton />;
  if (busy) {
    return (
      <Button variant="outline" className={ROW_BTN} disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t("VERIFYING")}
      </Button>
    );
  }
  if (isStatusLoading) {
    return (
      <Button variant="outline" className={ROW_BTN} disabled>
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t("LOADING")}
      </Button>
    );
  }
  // A redeemed attestation is waiting: land it, don't run a new wizard.
  if (hasPending) {
    return (
      <Button className={ROW_BTN} onClick={onFinish}>
        {t("VFX_FINISH_VERIFICATION")}
      </Button>
    );
  }
  // Unknown status must not read as "unverified".
  if (statusError) return <StatusCheckFailedAction onRetry={onRetryStatus} />;
  return (
    <Button variant="outline" className={ROW_BTN} onClick={onStart}>
      {t("GET_VERIFIED")}
    </Button>
  );
}

/**
 * Liveness verification card — the face-only tier, and the first thing on the
 * list because it is the cheapest to complete: no passport, no document, just a
 * short in-browser liveness challenge.
 *
 * Runs the same shape as the KYC card (redirect to a hosted wizard, come back
 * with a one-time `code`), against a **different service**: its own host, its
 * own tenant registry and its own `LivenessVerifier` EIP-712 domain, redeemed
 * into `submitLivenessAttestation` rather than `submitKycAttestation`. Both
 * wizards return to `/limits`, so the `state` prefix is what tells the two
 * handlers apart — this one only claims `state=liveness-…`. The wizard now
 * returns to /limits/liveness; /limits still forwards older callbacks here.
 *
 * Uniqueness is the liveness service's 1:N face dedup plus the on-chain
 * nullifier, so the RP lands once per human, not once per wallet. Holding a KYC
 * attestation does not preclude this one: separate services, separate dedup
 * sets, separate rewards.
 */
export function LivenessVerificationCard() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { livenessRp, isLivenessRpLoading, isLivenessRpError } =
    useLivenessRpReward();
  const {
    isLivenessVerified,
    isLivenessStatusLoading,
    livenessStatusError,
    refetchLivenessStatus,
  } = useLivenessVerificationStatus();
  const { mutateAsync: submitLiveness } = useSubmitLivenessAttestation();

  // The liveness tier is offered in every market except the excluded ones.
  // Unlike KYC it needs no country prebound (no document is read), so there is
  // no currency→country mapping to gate on.
  const isOffered = !LIVENESS_EXCLUDED_COUNTRIES.includes(
    settings.currency.country,
  );

  const resume = useCallback(
    (code: string) => resumeLivenessFlow({ baseUrl: LIVENESS_BASE_URL, code }),
    [],
  );
  const createSession = useCallback(
    (walletAddress: `0x${string}`) =>
      createLivenessFlow({
        baseUrl: LIVENESS_BASE_URL,
        walletAddress,
        tenant: LIVENESS_TENANT,
        redirectUrl: `${window.location.origin}${INTERNAL_HREFS.LIMITS_LIVENESS}`,
        state: `liveness-${Math.random().toString(36).slice(2)}`,
      }),
    [],
  );

  const { busy, pending, start, finish } = useHostedVerification({
    kind: "liveness",
    isVerified: isLivenessVerified,
    refetchStatus: refetchLivenessStatus,
    submitAttestation: submitLiveness,
    resume,
    createSession,
    failedTitleKey: "LIM_LIVENESS_FAILED_TITLE",
    verifyingKey: "LIVENESS_VERIFYING",
    successKey: "LIVENESS_VERIFIED_WITH_REWARD",
  });

  if (!isOffered) return null;

  return (
    <VerificationItem
      name="Liveness"
      title={t("METHOD_LIVENESS_TITLE")}
      icon={<SmilePlus className="size-5 text-primary" />}
      description={t("LIVENESS_DESCRIPTION")}
      rpReward={
        isLivenessRpLoading || isLivenessRpError || !livenessRp ? 0 : livenessRp
      }
      isVerified={!!isLivenessVerified}
      isStatusLoading={isLivenessStatusLoading || isLivenessRpLoading}
      socialStatusError={livenessStatusError || null}
      refetchSocialStatus={refetchLivenessStatus}
      customButton={
        <HostedVerificationButton
          isVerified={!!isLivenessVerified}
          isStatusLoading={isLivenessStatusLoading}
          statusError={livenessStatusError || null}
          onRetryStatus={() => void refetchLivenessStatus()}
          busy={busy}
          hasPending={!!pending}
          onStart={() => void start()}
          onFinish={finish}
        />
      }
    />
  );
}

/**
 * Identity (KYC) verification card. Unlike the Reclaim socials (an in-page
 * modal), this redirects to the hosted simple-kyc wizard (passport + liveness),
 * which hands back a one-time `code` at `${origin}/limits?code=…&state=kyc-…`.
 * We redeem the code for the EIP-712 attestation and submit it on-chain, which
 * credits the KYC rp. Uniqueness is enforced by the face dedup + the on-chain
 * nullifier, so the reward lands once per human.
 *
 * Rendered through `VerificationItem` so it matches the social cards exactly.
 */
export function KycVerificationCard() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  // simple-kyc requires the passport country up front (the wizard skips that
  // step). Derive it from the user's selected market; markets we can't map to a
  // supported KYC country (USD, EUR) don't get the card at all.
  const kycCountry = KYC_COUNTRY_BY_CURRENCY[settings.currency.currency];
  const { kycRp, isKycRpLoading, isKycRpError } = useKycRpReward();
  const {
    isKycVerified,
    isKycStatusLoading,
    kycStatusError,
    refetchKycStatus,
  } = useKycVerificationStatus();
  const { mutateAsync: submitKyc } = useSubmitKycAttestation();

  const resume = useCallback(
    (code: string) =>
      resumeSimpleKycFlow({ baseUrl: SIMPLE_KYC_BASE_URL, code }),
    [],
  );
  const createSession = useCallback(
    (walletAddress: `0x${string}`) => {
      if (!kycCountry) {
        toast.error(t("KYC_NOT_AVAILABLE_FOR_REGION"));
        return null;
      }
      return createSimpleKycFlow({
        baseUrl: SIMPLE_KYC_BASE_URL,
        walletAddress,
        tenant: SIMPLE_KYC_TENANT,
        redirectUrl: `${window.location.origin}${INTERNAL_HREFS.LIMITS_PASSPORT}`,
        country: kycCountry,
        state: `kyc-${Math.random().toString(36).slice(2)}`,
      });
    },
    [kycCountry, t],
  );
  const startTrackExtra = useMemo(
    () => ({ country: kycCountry }),
    [kycCountry],
  );

  const { busy, pending, start, finish } = useHostedVerification({
    kind: "kyc",
    isVerified: isKycVerified,
    refetchStatus: refetchKycStatus,
    submitAttestation: submitKyc,
    resume,
    createSession,
    startTrackExtra,
    failedTitleKey: "LIM_KYC_FAILED_TITLE",
    verifyingKey: "IDENTITY_VERIFYING",
    successKey: "IDENTITY_VERIFIED_WITH_REWARD",
  });

  // KYC isn't offered for markets without a supported passport country.
  if (!kycCountry) return null;

  return (
    <VerificationItem
      name="Identity (KYC)"
      title={t("METHOD_PASSPORT_TITLE")}
      icon={<ScanFace className="size-5 text-primary" />}
      description={t("KYC_DESCRIPTION")}
      rpReward={isKycRpLoading || isKycRpError || !kycRp ? 0 : kycRp}
      isVerified={!!isKycVerified}
      isStatusLoading={isKycStatusLoading || isKycRpLoading}
      socialStatusError={kycStatusError || null}
      refetchSocialStatus={refetchKycStatus}
      customButton={
        <HostedVerificationButton
          isVerified={!!isKycVerified}
          isStatusLoading={isKycStatusLoading}
          statusError={kycStatusError || null}
          onRetryStatus={() => void refetchKycStatus()}
          busy={busy}
          hasPending={!!pending}
          onStart={() => void start()}
          onFinish={finish}
        />
      }
    />
  );
}
