import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/settings";
import { useHaptics } from "./use-haptics";

const VERSION_CLICK_TARGET = 10;
const VERSION_PROGRESS_THRESHOLD = 5;
const RESET_TIMEOUT = 3000;

/**
 * Hook for version number click counter
 */
export function useVersionClickCounter() {
  const [clickCount, setClickCount] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { settings, setDevMode, error } = useSettings();
  const { triggerTapHaptic, triggerSuccessHaptic } = useHaptics();

  const handleClick = useCallback(() => {
    if (settings.devMode) return;

    triggerTapHaptic();

    setClickCount((prev) => {
      const newCount = prev + 1;

      // Show progress after threshold
      if (newCount >= VERSION_PROGRESS_THRESHOLD) {
        setShowProgress(true);
      }

      // Activate dev mode on target
      if (newCount >= VERSION_CLICK_TARGET) {
        setDevMode(true);
        if (error) {
          console.error("Failed to enable dev mode:", error);
          toast.error(error.message);
          return 0;
        }
        triggerSuccessHaptic();
        setShowProgress(false);
        return 0;
      }

      return newCount;
    });

    // Reset timeout
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
      setShowProgress(false);
    }, RESET_TIMEOUT);
  }, [
    settings.devMode,
    triggerTapHaptic,
    triggerSuccessHaptic,
    setDevMode,
    error,
  ]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const progress = Math.min(clickCount / VERSION_CLICK_TARGET, 1);
  const remainingClicks = Math.max(VERSION_CLICK_TARGET - clickCount, 0);

  return {
    handleClick,
    clickCount,
    progress,
    showProgress,
    remainingClicks,
    isActive: clickCount > 0,
  };
}
