import { useEffect } from "react";
import { useSettings } from "@/contexts";
import { useThirdweb } from "@/hooks";
import { ensureAiSupportWidget } from "@/lib/support-chat";

// Mounts the p2p.me AI support chat floating launcher once, globally, at app
// start. The launcher is lifted above the sticky Buy/Pay/Sell footer so it no
// longer overlaps the Sell USDC button (see lib/support-chat.ts). The same
// shared instance is also opened on demand from the Help page / FAQ search.
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
  }, [currency.currency, account?.address, isLoggedIn]);

  return null;
};
