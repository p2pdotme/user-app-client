import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/use-analytics";
import { EVENTS } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallPromptVisible: boolean;
  handleInstallClick: () => void;
  closeInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallPromptVisible, setInstallPromptVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallPromptVisible(true);

      // Track PWA install prompt availability
      track(EVENTS.PWA, {
        status: "prompt_available",
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
    };
  }, [track]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Track install attempt
      track(EVENTS.PWA, {
        status: "attempted",
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });

      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] User accepted the install prompt");
          // Track successful installation
          track(EVENTS.PWA, {
            status: "installed",
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          });
          toast.success(t("PWA_INSTALL_ACCEPTED"), {
            description: t("PWA_INSTALL_ACCEPTED_DESCRIPTION"),
          });
        } else {
          console.log("[PWA] User dismissed the install prompt");
          // Track installation dismissal
          track(EVENTS.PWA, {
            status: "dismissed",
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          });
          toast.info(t("PWA_INSTALL_CANCELLED"), {
            description: t("PWA_INSTALL_CANCELLED_DESCRIPTION"),
          });
        }
        setDeferredPrompt(null);
        setInstallPromptVisible(false);
      });
    } else {
      // Track install attempt when no prompt is available
      track(EVENTS.PWA, {
        status: "attempted_no_prompt",
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      });
    }
  };

  const closeInstallPrompt = () => {
    setInstallPromptVisible(false);
    track(EVENTS.PWA, {
      status: "banner_dismissed",
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  };

  const value: PWAContextType = {
    isInstallPromptVisible,
    handleInstallClick,
    closeInstallPrompt,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
