import { useFraudEngine } from "@p2pdotme/sdk/react";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { useThirdweb } from "@/hooks";
import { analytics, EVENTS } from "@/lib/analytics";
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
 * Routes a signed-out visitor may open without being sent to login: help
 * content (so people stuck at login can still find answers) and the
 * private-key wallet recovery tool, which works entirely without a connected
 * wallet. `/recovery` (wrong-network token recovery) is NOT public: it signs
 * with the connected wallet.
 */
export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === INTERNAL_HREFS.LOGIN ||
    pathname === INTERNAL_HREFS.MAINTENANCE ||
    pathname === INTERNAL_HREFS.HELP ||
    pathname.startsWith(`${INTERNAL_HREFS.HELP}/`) ||
    pathname === INTERNAL_HREFS.RECOVER
  );
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
 * 2. When wallet is disconnected and user is not on a public page (login,
 *    maintenance, help, private-key recover; see isPublicRoute) -> navigate to login
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

  // Stop blocking the app on a wallet auto-connect/connect that never resolves.
  // After the timeout the navigation effect below is allowed to fall through
  // (redirecting to login when there's still no account) instead of leaving the
  // full-screen loader up indefinitely.
  const [connectTimedOut, setConnectTimedOut] = useState(false);
  const isConnecting =
    isAutoConnectLoading || connectionStatus === "connecting";

  // Read at fire time for analytics only, so the timer is (re)armed solely
  // when the connecting state flips.
  const timeoutContextRef = useRef({ isAutoConnectLoading, pathname: "" });
  timeoutContextRef.current = {
    isAutoConnectLoading,
    pathname: location.pathname,
  };

  useEffect(() => {
    if (!isConnecting) {
      setConnectTimedOut(false);
      return;
    }
    const id = setTimeout(() => {
      setConnectTimedOut(true);
      const ctx = timeoutContextRef.current;
      analytics.track(EVENTS.WALLET, {
        status: "connect_timeout",
        phase: ctx.isAutoConnectLoading ? "auto_connect" : "connect",
        pathname: ctx.pathname,
      });
    }, 10_000);
    return () => clearTimeout(id);
  }, [isConnecting]);

  useEffect(() => {
    const currentPath = location.pathname;
    const isOnLoginPage = currentPath === INTERNAL_HREFS.LOGIN;

    // Skip navigation logic during auto-connect loading to prevent flickering,
    // unless the connect attempt has already timed out (then fall through so a
    // stuck auto-connect still resolves to login instead of hanging).
    if (isAutoConnectLoading && !connectTimedOut) {
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

    // Case 2: User is disconnected and not on a public page -> navigate to login
    if (connectionStatus === "disconnected" && !isPublicRoute(currentPath)) {
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
    connectTimedOut,
    location.pathname,
    navigate,
    wallet,
    fraudEngine,
  ]);

  // Show loading spinner during auto-connect or connecting states
  // but NOT on public pages (login/maintenance handle their own loading; help
  // and recovery must stay reachable even when the wallet is slow to connect)
  const shouldShowGlobalLoading =
    isConnecting && !connectTimedOut && !isPublicRoute(location.pathname);

  if (shouldShowGlobalLoading) {
    return (
      <AuthLoadingScreen
        isAutoConnecting={isAutoConnectLoading}
        isManualConnecting={connectionStatus === "connecting"}
      />
    );
  }

  // A signed-out visitor on a protected route is about to be redirected to
  // login by the effect above. Don't mount the protected screen in the
  // meantime: rendering it for even one frame starts downloading that screen's
  // code (Home pulls in animations, rewards, etc.) that a first-time visitor
  // doesn't need yet.
  const redirectToLoginPending =
    connectionStatus === "disconnected" &&
    !isPublicRoute(location.pathname) &&
    !(isAutoConnectLoading && !connectTimedOut);
  if (redirectToLoginPending) {
    // A solid page, not `null`: the router keeps showing this while the login
    // page's code loads, and with nothing rendered the App wrapper's purple
    // backdrop gradient flashed full-screen on every logout.
    return (
      <div
        aria-hidden="true"
        className="flex h-dvh w-full bg-background text-foreground"
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
