import { createRelayIdentity } from "@p2pdotme/sdk/orders";
import { useFraudEngine } from "@p2pdotme/sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
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
import { clearLimitReturn } from "@/lib/limit-increase";
import { identifyUser } from "@/lib/sentry";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { clearLastSellPaymentDetails } from "@/pages/sell/last-sell-payment-details";

/**
 * Outcome of `connect()`. It never throws; callers branch on this instead.
 * - "connected": wallet connected
 * - "cancelled": the user closed the login modal (neutral, nothing shown)
 * - "failed": a real failure; a friendly error toast was already shown
 */
export type ConnectResult = "connected" | "cancelled" | "failed";

/**
 * Stable, non-sensitive reason for analytics: the i18n key the friendly
 * message maps to (e.g. "ERROR_NETWORK_DESCRIPTION"), never the raw message.
 */
export function getUserFacingErrorReasonKey(error: unknown): string {
  return getUserFacingErrorMessage(
    ((key: string) => key) as unknown as TFunction,
    error,
  );
}

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
  const queryClient = useQueryClient();

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

  // Feed the localized "Don't share OTP" warning to the CSS rule that renders
  // it inside thirdweb's connect modal (see `--tw-otp-warning` in index.css).
  // Purely cosmetic: on any failure the variable is cleared, which hides the
  // warning (the CSS has no fallback) without affecting login.
  useEffect(() => {
    const OTP_WARNING_VAR = "--tw-otp-warning";
    const rootStyle = document.documentElement.style;
    try {
      const message = t("DONT_SHARE_OTP");
      const isTranslated =
        typeof message === "string" &&
        message.trim() !== "" &&
        message !== "DONT_SHARE_OTP";
      if (isTranslated) {
        rootStyle.setProperty(OTP_WARNING_VAR, JSON.stringify(message));
      } else {
        rootStyle.removeProperty(OTP_WARNING_VAR);
      }
    } catch (error) {
      console.warn("Failed to set OTP warning text:", error);
      try {
        rootStyle.removeProperty(OTP_WARNING_VAR);
      } catch {
        // Nothing else to do — the warning simply won't render.
      }
    }
  }, [t]);

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

  const connect = useCallback(async (): Promise<ConnectResult> => {
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

      // No wallet address in the toast: a raw 0x string means nothing to
      // most users and exposes the address on shared screens.
      toast.success(t("LOGGED_IN_SUCCESSFULLY"));
      return "connected";
    } catch (error) {
      // thirdweb's connect modal rejects with `undefined` when the user closes
      // it, so a missing error is a deliberate dismissal, not a failure.
      if (error == null || isUserCancellation(error)) {
        track(EVENTS.WALLET, { status: "cancelled", walletType: "unknown" });
        return "cancelled";
      }

      // Analytics get the stable mapped reason (an i18n key), never the raw
      // SDK message.
      track(EVENTS.WALLET, {
        status: "failed",
        walletType: "unknown",
        reason: getUserFacingErrorReasonKey(error),
      });

      toast.error(t("LOGGED_IN_FAILED"), {
        description: getUserFacingErrorMessage(t, error),
      });
      return "failed";
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
        clearLimitReturn();
        clearLastSellPaymentDetails();
      } catch {}
      // Drop every cached query (limits, balances, verification status...) so
      // the next account never sees the previous one's data.
      queryClient.clear();
      toast.success(t("LOGGED_OUT_SUCCESSFULLY"));
    } catch (error) {
      toast.error(t("LOGGED_OUT_FAILED"), {
        description: getUserFacingErrorMessage(t, error),
      });
    }
  }, [wallet, t, fraudEngine, queryClient]);

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
