import { useFraudEngine } from "@p2pdotme/sdk/react";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useThirdweb } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import {
  hasStoredParams,
  preserveUrlParams,
  restoreUrlParams,
} from "@/lib/url-param-preservation";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard component that handles global authentication navigation
 *
 * Connection Status States (from thirdweb):
 * - "connecting" - Wallet is in the process of connecting
 * - "connected" - Wallet is successfully connected
 * - "disconnected" - Wallet is not connected
 *
 * Rules:
 * 1. When wallet is connected and user is on login page -> navigate to home/restore URL
 * 2. When wallet is disconnected and user is not on login/maintenance pages -> navigate to login
 * 3. Show loading during auto-connect and connecting states to prevent flickering
 * 4. Ignore navigation during auto-connect loading
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, wallet, connectionStatus, isAutoConnectLoading } =
    useThirdweb();
  const fraudEngine = useFraudEngine();
  const loggedLoginRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const isOnLoginPage = currentPath === INTERNAL_HREFS.LOGIN;
    const isOnMaintenancePage = currentPath === INTERNAL_HREFS.MAINTENANCE;

    // Skip navigation logic during auto-connect loading to prevent flickering
    if (isAutoConnectLoading) {
      return;
    }

    // Case 1: User is connected and on login page -> navigate to home/restore URL
    if (account?.address && connectionStatus === "connected" && isOnLoginPage) {
      console.log(
        "[AuthGuard] Connected user on login page, proceeding with restoration/home",
      );

      // Log fingerprint via SDK (once per login session, all currencies)
      if (wallet && loggedLoginRef.current !== account.address) {
        loggedLoginRef.current = account.address;
        // Track the smart wallet (account.address) but sign with the admin
        // EOA, because smart wallet contracts can't produce EIP-191 signatures.
        // For plain EOA wallets, getAdminAccount?.() is undefined and both
        // addresses collapse to the same account.
        const adminAccount = wallet.getAdminAccount?.() ?? wallet.getAccount();
        if (adminAccount) {
          const signer = {
            address: account.address,
            signerAddress: adminAccount.address,
            signMessage: (msg: string) =>
              adminAccount.signMessage({ message: msg }),
          };
          fraudEngine.logFingerprint({ signer }).then((result) => {
            if (result.isErr()) {
              console.error(
                "[AuthGuard] Failed to log fingerprint:",
                result.error,
              );
            }
          });
        }
      }

      // Check if we have stored parameters from before the auth flow
      if (hasStoredParams()) {
        console.log(
          "[AuthGuard] Restoring URL parameters after successful auth",
        );
        const restorationUrl = restoreUrlParams();

        if (restorationUrl) {
          console.log("[AuthGuard] Navigating to:", restorationUrl);
          navigate(restorationUrl, { replace: true });
        } else {
          console.log(
            "[AuthGuard] No valid restoration URL, navigating to home",
          );
          navigate(INTERNAL_HREFS.HOME, { replace: true });
        }
      } else {
        console.log("[AuthGuard] No stored parameters, navigating to home");
        navigate(INTERNAL_HREFS.HOME, { replace: true });
      }
      return;
    }

    // Case 2: User is disconnected and not on allowed pages -> navigate to login
    if (
      connectionStatus === "disconnected" &&
      !isOnLoginPage &&
      !isOnMaintenancePage
    ) {
      console.log(
        "[AuthGuard] Disconnected user on protected page, navigating to login",
      );

      loggedLoginRef.current = null;

      // Preserve URL parameters before redirecting to login
      // This ensures campaign/referral parameters survive the auth flow
      preserveUrlParams();

      navigate(INTERNAL_HREFS.LOGIN, { replace: true });
      return;
    }

    // Log current state for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log("[AuthGuard] Status:", {
        connectionStatus,
        hasAccount: !!account?.address,
        currentPath,
        isAutoConnectLoading,
      });
    }
  }, [
    account?.address,
    connectionStatus,
    isAutoConnectLoading,
    location.pathname,
    navigate,
    wallet,
    fraudEngine,
  ]);

  // Show loading spinner during auto-connect or connecting states
  // but NOT on login or maintenance pages (they handle their own loading)
  const currentPath = location.pathname;
  const isOnLoginPage = currentPath === INTERNAL_HREFS.LOGIN;
  const isOnMaintenancePage = currentPath === INTERNAL_HREFS.MAINTENANCE;

  const shouldShowGlobalLoading =
    (isAutoConnectLoading || connectionStatus === "connecting") &&
    !isOnLoginPage &&
    !isOnMaintenancePage;

  if (shouldShowGlobalLoading) {
    return (
      <AuthLoadingScreen
        isAutoConnecting={isAutoConnectLoading}
        isManualConnecting={connectionStatus === "connecting"}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Minimal, subtle loading screen that clearly communicates what's happening
 */
function AuthLoadingScreen({
  isAutoConnecting,
  isManualConnecting,
}: {
  isAutoConnecting: boolean;
  isManualConnecting: boolean;
}) {
  const { t } = useTranslation();

  const getMessage = () => {
    if (isAutoConnecting) {
      return t("CHECKING_WALLET_CONNECTION");
    }
    if (isManualConnecting) {
      return t("CONNECTING_WALLET");
    }
    return t("LOADING_APP");
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-background text-foreground">
      <Loader2 className="size-16 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">{getMessage()}</p>
    </div>
  );
}
