import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IOSPWADrawer } from "@/components/ios-pwa-drawer";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/contexts/pwa";
import { isIOS } from "@/lib/utils";

export function InstallPWAButton() {
  const { t } = useTranslation();
  const { isInstallPromptVisible, handleInstallClick } = usePWA();
  const [isIOSDrawerOpen, setIsIOSDrawerOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed as PWA)
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if device is iOS/iPadOS
    setIsAppleDevice(isIOS());
  }, []);

  // Don't show button if app is already installed
  if (isStandalone) {
    return null;
  }

  // For non-Apple devices, only show if install prompt is available
  if (!isAppleDevice && !isInstallPromptVisible) {
    return null;
  }

  const handleClick = () => {
    if (isAppleDevice) {
      // Show iOS installation instructions
      setIsIOSDrawerOpen(true);
    } else {
      // Use native install prompt for other browsers
      handleInstallClick();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="secondary"
        className="rounded-xl font-normal">
        <Download className="size-4" />
        <span className="sr-only">{t("INSTALL_APP")}</span>
      </Button>

      {isAppleDevice && (
        <IOSPWADrawer
          isOpen={isIOSDrawerOpen}
          onClose={() => setIsIOSDrawerOpen(false)}
        />
      )}
    </>
  );
}
