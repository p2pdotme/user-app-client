import { useCallback } from "react";
import { analytics } from "@/lib/analytics";

/**
 * Simple analytics hook for tracking business-critical events
 * Backed by Amplitude via the analytics wrapper
 */
export function useAnalytics() {
  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      analytics.track(event, properties);
    },
    [],
  );

  const trackWithDedupe = useCallback(
    (
      event: string,
      dedupeKey: string,
      properties?: Record<string, unknown>,
    ) => {
      analytics.trackWithDedupe(event, dedupeKey, properties);
    },
    [],
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      analytics.identify(userId, traits);
    },
    [],
  );

  return { track, trackWithDedupe, identify };
}
