import { useEffect } from "react";
import { useSettings } from "@/contexts";
import { useThirdweb } from "@/hooks";
import {
  destroyAiSupportWidget,
  ensureAiSupportWidget,
} from "@/lib/support-chat";

// Mounts the p2p.me AI support chat floating launcher ONLY while the Help &
// Support page is on screen — render this from that page, not globally, so the
// floating icon doesn't sit on top of every other screen. The launcher is
// lifted above the sticky Buy/Pay/Sell footer so it doesn't overlap the Sell
// USDC button (see lib/support-chat.ts). The same shared instance is also opened
// on demand from the Help page's "Ask AI Assistant" button / FAQ search. On
// unmount (leaving Help) the widget is torn down so it never lingers elsewhere.
export const SupportWidget = () => {
  const {
    settings: { currency },
  } = useSettings();
  const { account, connectionStatus } = useThirdweb();
  const isLoggedIn = connectionStatus === "connected" && !!account?.address;

  useEffect(() => {
    // Only show the support launcher to authenticated users. The widget derives
    // its default language from the selected currency; the wallet lets the
    // agent answer order questions directly (no address ask).
    if (!isLoggedIn) return;
    void ensureAiSupportWidget(currency.currency || "global", account?.address);
    // Leaving the Help page destroys the launcher so it's not a floating icon
    // everywhere else in the app.
    return () => void destroyAiSupportWidget();
  }, [currency.currency, account?.address, isLoggedIn]);

  return null;
};
