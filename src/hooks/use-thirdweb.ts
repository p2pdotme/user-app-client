import { createRelayIdentity } from "@p2pdotme/sdk/orders";
import { useFraudEngine } from "@p2pdotme/sdk/react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  darkTheme,
  lightTheme,
  type ThemeOverrides,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useAutoConnect,
  useConnectModal,
  useWalletDetailsModal,
} from "thirdweb/react";
import { useSettings } from "@/contexts/settings";
import {
  createConnectWalletConfig,
  thirdwebClient,
  walletDetailsModalConfig,
} from "@/core/adapters/thirdweb";
import { getResolvedTheme } from "@/core/client/settings";
import { useAnalytics } from "@/hooks/use-analytics";
import { EVENTS } from "@/lib/analytics";
import { STORAGE_KEYS } from "@/lib/constants";
import { identifyUser } from "@/lib/sentry";

const thirdwebThemeOverrides: ThemeOverrides = {
  colors: {
    primaryButtonBg: "var(--primary)",
    primaryButtonText: "var(--primary-foreground)",
    accentText: "var(--primary)",
    accentButtonBg: "var(--primary)",
    accentButtonText: "var(--primary-foreground)",
    modalBg: "var(--background)",
    secondaryButtonBg: "var(--card)",
    secondaryButtonText: "var(--card-foreground)",
    primaryText: "var(--foreground)",
    secondaryText: "var(--muted-foreground)",
    borderColor: "var(--border)",
  },
};

export function useThirdweb() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const resolvedTheme = getResolvedTheme(settings.theme);
  const { track, identify } = useAnalytics();
  const fraudEngine = useFraudEngine();

  // Theme with colors from index.css
  const theme = useMemo(() => {
    if (resolvedTheme === "dark") {
      return darkTheme(thirdwebThemeOverrides);
    } else {
      return lightTheme(thirdwebThemeOverrides);
    }
  }, [resolvedTheme]);

  // Memoize wallet config based on currency setting - single source of truth
  const walletConfig = useMemo(
    () => createConnectWalletConfig(settings.currency.currency),
    [settings.currency.currency],
  );

  const { isLoading: isAutoConnectLoading, isSuccess: isAutoConnectSuccess } =
    useAutoConnect({
      ...walletConfig,
      client: thirdwebClient,
      onTimeout: () => toast.warning(t("WALLET_CONNECTION_TIMEOUT")),
    });
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();
  const { connect: _connect } = useConnectModal();
  const { open: _openDetailsModal } = useWalletDetailsModal();

  const openDetailsModal = useCallback(() => {
    _openDetailsModal({
      ...walletDetailsModalConfig,
      theme,
      client: thirdwebClient,
    });
  }, [_openDetailsModal, theme]);

  // Simple Sentry user identification
  useEffect(() => {
    if (account?.address && connectionStatus === "connected") {
      identifyUser(account.address, {
        wallet_type: "thirdweb",
        connection_status: connectionStatus,
        connected_at: Date.now(),
      });
    }
  }, [account, connectionStatus]);

  // Ensure relay identity exists after auto-connect
  useEffect(() => {
    if (isAutoConnectSuccess && account?.address) {
      try {
        const existing = localStorage.getItem(STORAGE_KEYS.RELAY_IDENTITY);
        if (!existing) {
          const identity = createRelayIdentity();
          localStorage.setItem(
            STORAGE_KEYS.RELAY_IDENTITY,
            JSON.stringify(identity),
          );
        }
      } catch (error) {
        console.error("Failed to create relay identity:", error);
        toast.error(t("FAILED_TO_CREATE_RELAY_IDENTITY"));
      }
    }
  }, [isAutoConnectSuccess, account?.address, t]);

  const connect = useCallback(async () => {
    try {
      const connectedWallet = await _connect({
        ...walletConfig,
        theme,
        client: thirdwebClient,
        size: "compact",
      });

      const walletAddress = connectedWallet.getAccount()?.address;
      if (walletAddress) {
        // Track successful wallet connection
        track(EVENTS.WALLET, {
          status: "connected",
          walletType: connectedWallet.id || "unknown",
          userId: walletAddress,
        });

        // Identify user for analytics
        identify(walletAddress, {
          wallet_type: connectedWallet.id || "unknown",
          connection_time: Date.now(),
        });

        // Create relay identity on successful connect if missing
        try {
          const existing = localStorage.getItem(STORAGE_KEYS.RELAY_IDENTITY);
          if (!existing) {
            const identity = createRelayIdentity();
            localStorage.setItem(
              STORAGE_KEYS.RELAY_IDENTITY,
              JSON.stringify(identity),
            );
          }
        } catch (error) {
          console.error("Failed to create relay identity:", error);
          toast.error(t("FAILED_TO_CREATE_RELAY_IDENTITY"));
        }
      }

      toast.success(t("LOGGED_IN_SUCCESSFULLY"), {
        description: walletAddress,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("LOGIN_CANCELLED");

      // Track failed wallet connection
      track(EVENTS.WALLET, {
        status: "failed",
        walletType: "unknown",
        errorMessage,
      });

      toast.error(t("LOGGED_IN_FAILED"), {
        description: errorMessage,
      });
    }
  }, [_connect, t, theme, track, identify, walletConfig]);

  const disconnect = useCallback(async () => {
    if (!wallet) {
      toast.warning(t("LOGGED_IN_FAILED"), {
        description: t("WALLET_NOT_CONNECTED"),
      });
      return;
    }
    try {
      await wallet.disconnect();
      // Clear relay identity on disconnect to reduce data leak surface
      try {
        localStorage.removeItem(STORAGE_KEYS.RELAY_IDENTITY);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        fraudEngine.cleanupSeonStorage();
      } catch {}
      toast.success(t("LOGGED_OUT_SUCCESSFULLY"));
    } catch (error) {
      toast.error(t("LOGGED_OUT_FAILED"), {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [wallet, t, fraudEngine]);

  return {
    account,
    wallet,
    connectionStatus,
    isAutoConnectLoading,
    isAutoConnectSuccess,
    openDetailsModal,
    connect,
    disconnect,
  };
}
