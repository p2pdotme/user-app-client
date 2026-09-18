import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useActiveWalletChain } from "thirdweb/react";
import { useSettings } from "@/contexts";
import { useThirdweb } from "@/hooks";
import { getSupportBridgeUrl } from "@/lib/support-bridge";
import {
  destroyAiSupportWidget,
  ensureAiSupportWidget,
  setSupportChatSigner,
  setSupportChatTelegram,
} from "@/lib/support-chat";

// Mounts the p2p.me AI support chat floating launcher ONLY while the Help &
// Support page is on screen — render this from that page, not globally, so the
// floating icon doesn't sit on top of every other screen. The launcher is
// lifted above the sticky Buy/Pay/Sell footer so it doesn't overlap the Sell
// USDC button (see lib/support-chat.ts). The same shared instance is also opened
// on demand from the Help page's "Ask AI Assistant" button / FAQ search. On
// unmount (leaving Help) the widget is torn down so it never lingers elsewhere.
export const SupportWidget = () => {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { account, connectionStatus } = useThirdweb();
  const activeChain = useActiveWalletChain();
  const bridgeUrl = getSupportBridgeUrl();
  const isLoggedIn = connectionStatus === "connected" && !!account?.address;

  // Wallet signer for the widget's built-in "Talk to a human" chat. Needs a live
  // chain id (bound into the bridge sign-in); without one, no signer → the human
  // action stays hidden and the AI is the only surface.
  const signer = useMemo(() => {
    if (!account || !activeChain) return null;
    return {
      address: account.address as `0x${string}`,
      signMessage: (message: string) => account.signMessage({ message }),
      getChainId: () => activeChain.id,
    };
  }, [account, activeChain]);

  useEffect(() => {
    // Only show the support launcher to authenticated users. The widget derives
    // its default language from the selected currency; the wallet lets the
    // agent answer order questions directly (no address ask).
    if (!isLoggedIn) return;
    // Register the signer + bridge URL BEFORE mounting so the widget picks up the
    // built-in human chat on creation.
    setSupportChatSigner(signer, bridgeUrl ?? null);
    // The market's Telegram group, shown as a secondary row inside the widget
    // under "Chat with support" — the community door stays open now that the
    // Help page's "Chat with us" button leads to the support thread instead.
    setSupportChatTelegram(
      currency.telegramSupportChannel
        ? {
            url: currency.telegramSupportChannel,
            label: t("CHAT_ON_TELEGRAM"),
            sub: t("CHAT_ON_TELEGRAM_SUBTITLE"),
          }
        : null,
    );
    void ensureAiSupportWidget(currency.currency || "global", account?.address);
    // Leaving the Help page destroys the launcher so it's not a floating icon
    // everywhere else in the app.
    return () => {
      setSupportChatSigner(null, null);
      setSupportChatTelegram(null);
      void destroyAiSupportWidget();
    };
  }, [
    currency.currency,
    currency.telegramSupportChannel,
    account?.address,
    isLoggedIn,
    signer,
    bridgeUrl,
    t,
  ]);

  return null;
};
