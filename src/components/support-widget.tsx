import { useEffect } from "react";
import { useSettings } from "@/contexts";
import { useThirdweb } from "@/hooks";

// Mounts the p2p.me AI support chat (floating launcher + panel) once, globally.
// The widget is a zero-dependency Shadow-DOM web component from `p2pme-ai-support`
// that attaches itself to document.body and talks to the commops agent API.
const SUPPORT_WIDGET_API_URL =
  (import.meta.env.VITE_SUPPORT_WIDGET_API_URL as string | undefined) ??
  "https://commops-production.up.railway.app";

export const SupportWidget = () => {
  const {
    settings: { currency },
  } = useSettings();
  const { account, connectionStatus } = useThirdweb();
  const isLoggedIn = connectionStatus === "connected" && !!account?.address;

  useEffect(() => {
    // Only show the support launcher to authenticated users.
    if (!isLoggedIn) return;

    let handle: { destroy: () => void } | undefined;
    let cancelled = false;

    // Lazy-import so the widget bundle stays out of the initial app chunk.
    import("p2pme-ai-support").then(({ createChatWidget }) => {
      if (cancelled) return;
      // p2pme-ai-support@0.2.0 adds typewriter reveal, starter-prompt chips, a
      // "from p2p.me docs" grounding note, 👍/👎 feedback and a Cmd/Ctrl-K
      // shortcut — all on by default, so no extra config is needed here. Pass
      // `starterPrompts` / `feedback` / `typewriter` to override.
      handle = createChatWidget({
        apiUrl: SUPPORT_WIDGET_API_URL,
        // Scope the agent's retrieval to the user's selected market.
        country: currency.currency || "global",
        title: "p2p.me support",
      });
    });

    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, [currency.currency, isLoggedIn]);

  return null;
};
