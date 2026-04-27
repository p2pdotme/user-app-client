import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { usePWA } from "@/contexts/pwa";

/**
 * PWAStatusDebug component for development mode
 * Shows current PWA state and provides debug controls
 */
export function PWAStatusDebug() {
  const { isInstallPromptVisible, handleInstallClick, closeInstallPrompt } =
    usePWA();
  const location = useLocation();

  const [isStandalone, setIsStandalone] = useState(false);
  const [swRegistration, setSWRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [swState, setSWState] = useState<string>("unknown");

  useEffect(() => {
    // Check if running in standalone mode (installed as PWA)
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setSWRegistration(registration || null);
        if (registration) {
          if (registration.active) {
            setSWState("active");
          } else if (registration.installing) {
            setSWState("installing");
          } else if (registration.waiting) {
            setSWState("waiting");
          } else {
            setSWState("registered");
          }
        } else {
          setSWState("not_registered");
        }
      });
    } else {
      setSWState("not_supported");
    }
  }, []);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "installed":
        return "bg-green-500/20 text-green-700 border-green-300";
      case "installing":
      case "waiting":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "not_registered":
      case "not_supported":
        return "bg-red-500/20 text-red-700 border-red-300";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-300";
    }
  };

  const handleForceUpdate = async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        console.log("[PWA Debug] Service worker update triggered");
      } catch (error) {
        console.error("[PWA Debug] Failed to update service worker:", error);
      }
    }
  };

  const handleUnregisterSW = async () => {
    if (swRegistration) {
      try {
        const result = await swRegistration.unregister();
        console.log("[PWA Debug] Service worker unregistered:", result);
        setSWRegistration(null);
        setSWState("not_registered");
      } catch (error) {
        console.error(
          "[PWA Debug] Failed to unregister service worker:",
          error,
        );
      }
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 border-2 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-sm">📱 PWA Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Install Status:</span>
          <Badge
            className={getStatusColor(
              isStandalone ? "installed" : "not_installed",
            )}>
            {isStandalone ? "Installed" : "Not Installed"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Install Prompt:</span>
          <Badge variant={isInstallPromptVisible ? "secondary" : "outline"}>
            {isInstallPromptVisible ? "Available" : "Not Available"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Service Worker:</span>
          <Badge className={getStatusColor(swState)}>
            {swState.replace("_", " ")}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Standalone Mode:</span>
          <Badge variant={isStandalone ? "secondary" : "outline"}>
            {isStandalone ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Path:</span>
          <span className="font-mono text-xs">{location.pathname}</span>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleInstallClick}
              disabled={!isInstallPromptVisible || isStandalone}
              className="h-7 flex-1 text-xs">
              Install PWA
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={closeInstallPrompt}
              disabled={!isInstallPromptVisible}
              className="h-7 flex-1 text-xs">
              Close Prompt
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceUpdate}
              disabled={!swRegistration}
              className="h-7 flex-1 text-xs">
              Update SW
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnregisterSW}
              disabled={!swRegistration}
              className="h-7 flex-1 text-xs">
              Unregister SW
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
