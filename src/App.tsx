import { AnonAadhaarProvider } from "@anon-aadhaar/react";
import { sdk } from "@farcaster/miniapp-sdk";
import { CONTRACT_ADDRESSES } from "@p2pdotme";
import { createLocalStorageRelayStore } from "@p2pdotme/sdk/orders";
import { SdkProvider as P2pdotmeProvider } from "@p2pdotme/sdk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { CDN_ASSET_URLS } from "@/assets";
import {
  AuthGuard,
  CurrencyGate,
  PageTransitioner,
  PWABadge,
  // AuthStatusDebug,
  // PWAStatusDebug,
} from "@/components";
import { Toaster } from "@/components/ui/sonner";
import {
  DynamicProviderWrapper,
  PWAProvider,
  SettingsProvider,
} from "@/contexts";
import { viemPublicClient } from "@/core/adapters/thirdweb/client";
import { analytics, EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS, STORAGE_KEYS } from "@/lib/constants";
import { preloadAssetUrls } from "@/lib/utils";
import { Router } from "@/router";

const queryClient = new QueryClient();

function App() {
  const navigate = useNavigate();

  // Preload CDN assets to reduce pop-in
  useEffect(() => {
    preloadAssetUrls(CDN_ASSET_URLS);
    sdk.actions.ready();
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
        {/* <PWAStatusDebug /> */}
        {/* Main content wrapped with page transitioner */}
        <QueryClientProvider client={queryClient}>
          <ThirdwebProvider>
            <P2pdotmeProvider
              publicClient={viemPublicClient}
              subgraphUrl={import.meta.env.VITE_SUBGRAPH_URL}
              diamondAddress={CONTRACT_ADDRESSES.DIAMOND}
              usdcAddress={CONTRACT_ADDRESSES.USDC}
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
              <AnonAadhaarProvider>
                <SettingsProvider>
                  <AuthGuard>
                    <DynamicProviderWrapper>
                      <PageTransitioner className="flex h-full w-full flex-col items-center justify-center bg-background text-foreground">
                        {/* First-run currency confirmation for all users */}
                        <CurrencyGate />
                        <Router />
                        {/* Debug component for development */}
                        {/* <AuthStatusDebug /> */}
                      </PageTransitioner>
                    </DynamicProviderWrapper>
                  </AuthGuard>
                </SettingsProvider>
              </AnonAadhaarProvider>
            </P2pdotmeProvider>
          </ThirdwebProvider>
        </QueryClientProvider>
      </PWAProvider>
    </div>
  );
}

export default App;
