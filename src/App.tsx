import { CONTRACT_ADDRESSES } from "@p2pdotme";
import { createLocalStorageRelayStore } from "@p2pdotme/sdk/orders";
import { SdkProvider as P2pdotmeProvider } from "@p2pdotme/sdk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ComponentProps, useEffect } from "react";
import { useNavigate } from "react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { CDN_ASSET_URLS } from "@/assets";
import {
  AuthGuard,
  CurrencyGate,
  ErrorBoundary,
  PageTransitioner,
  PWABadge,
} from "@/components";
import { Toaster } from "@/components/ui/sonner";
import { PWAProvider, SettingsProvider } from "@/contexts";
import { viemPublicClient } from "@/core/adapters/thirdweb/client";
import { analytics, EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS, STORAGE_KEYS } from "@/lib/constants";
import { preloadAssetUrls } from "@/lib/utils";
import { Router } from "@/router";

const queryClient = new QueryClient();

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Tell a Farcaster/Base mini-app host we're ready. The SDK (and the Solana
    // library it bundles) is loaded on demand, and only inside a mini-app.
    // Mini-app hosts embed the app in an iframe or a React Native WebView;
    // regular browser/PWA visitors never download the SDK at all.
    const maybeInMiniApp =
      window.self !== window.top || "ReactNativeWebView" in window;
    if (maybeInMiniApp) {
      void import("@farcaster/miniapp-sdk")
        .then(({ sdk }) => sdk.actions.ready())
        .catch(() => undefined);
    }

    // Warm CDN assets (animations, sounds, banners) only once the browser is
    // idle, so they don't compete with what the first screen needs. Skip it
    // entirely when the user asked to save data.
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    const warm = () => void preloadAssetUrls(CDN_ASSET_URLS);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm, { timeout: 8000 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari < 17 has no requestIdleCallback.
    const id = globalThis.setTimeout(warm, 4000);
    return () => globalThis.clearTimeout(id);
  }, []);

  useEffect(() => {
    // Track app lifecycle
    analytics.track(EVENTS.APP, {
      status: "launched",
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      referrer: document.referrer,
      url: window.location.href,
      pathname: window.location.pathname,
      isMaintenanceMode: import.meta.env.VITE_MAINTENANCE === "true",
      isPWA: window.matchMedia("(display-mode: standalone)").matches,
    });

    if (import.meta.env.VITE_MAINTENANCE === "true") {
      navigate(INTERNAL_HREFS.MAINTENANCE);
    } else if (window.location.pathname.includes("/maintenance")) {
      navigate(INTERNAL_HREFS.HOME);
    }

    // Track session end when user leaves the app
    const handleBeforeUnload = () => {
      analytics.track(EVENTS.APP, {
        status: "session_ended",
        timestamp: Date.now(),
        sessionDuration: Date.now() - performance.timeOrigin,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        analytics.track(EVENTS.APP, {
          status: "backgrounded",
          timestamp: Date.now(),
        });
      } else if (document.visibilityState === "visible") {
        analytics.track(EVENTS.APP, {
          status: "foregrounded",
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate]);

  return (
    <div className="items-center-safe justify-center-safe flex h-dvh min-h-dvh w-full flex-col bg-radial from-background to-primary">
      {/* Toast notifications */}
      <Toaster position="top-center" swipeDirections={["top"]} />

      <PWAProvider>
        {/* PWA Badge */}
        <PWABadge />
        {/* Main content wrapped with page transitioner */}
        <QueryClientProvider client={queryClient}>
          <ThirdwebProvider>
            <P2pdotmeProvider
              // thirdweb bundles a newer viem than the SDK, so its public
              // client carries an extra deployless `readContract` overload.
              // Cast to the SDK's expected prop type; runtime shape is valid.
              publicClient={
                viemPublicClient as unknown as ComponentProps<
                  typeof P2pdotmeProvider
                >["publicClient"]
              }
              subgraphUrl={import.meta.env.VITE_SUBGRAPH_URL}
              diamondAddress={CONTRACT_ADDRESSES.DIAMOND}
              usdcAddress={CONTRACT_ADDRESSES.USDC}
              p2pTokenAddress={CONTRACT_ADDRESSES.P2P_TOKEN}
              orders={{
                relayIdentityStore: createLocalStorageRelayStore({
                  key: STORAGE_KEYS.RELAY_IDENTITY,
                }),
              }}
              reputationManagerAddress={
                import.meta.env.VITE_CONTRACT_ADDRESS_REPUTATION_MANAGER
              }
              fraudEngine={{
                apiUrl: import.meta.env.VITE_ACTIVITY_LOG_API_URL,
                encryptionKey: import.meta.env.VITE_ACTIVITY_LOG_ENCRYPTION_KEY,
                seonRegion: "asia",
              }}
              logger={console}>
              <SettingsProvider>
                <AuthGuard>
                  <PageTransitioner className="flex h-full w-full flex-col items-center justify-center bg-background text-foreground">
                    {/* First-run currency confirmation for all users */}
                    <CurrencyGate />
                    <ErrorBoundary>
                      <Router />
                    </ErrorBoundary>
                    {/* AI support chat launcher is mounted by the Help &
                          Support page only (see pages/help), not globally —
                          so the floating icon isn't shown on every screen. */}
                  </PageTransitioner>
                </AuthGuard>
              </SettingsProvider>
            </P2pdotmeProvider>
          </ThirdwebProvider>
        </QueryClientProvider>
      </PWAProvider>
    </div>
  );
}

export default App;
