import {
  identify as amplitudeIdentify,
  track as amplitudeTrack,
  Identify,
  init,
  setUserId,
} from "@amplitude/analytics-browser";

// Simple Amplitude setup
const AMPLITUDE_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;
const ANALYTICS_ENABLED = AMPLITUDE_KEY !== undefined;

// Initialize Amplitude (no auto-capture/plugins by default)
if (ANALYTICS_ENABLED) {
  init(AMPLITUDE_KEY, {
    defaultTracking: false,
  });
}

// TransactionKind and BridgeKind were used by helpers now removed; keep minimal surface

function addCommonProps(properties?: Record<string, unknown>) {
  const base: Record<string, unknown> = {
    env: ENVIRONMENT,
    locale: typeof navigator !== "undefined" ? navigator.language : undefined,
    pathname:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    isPWA:
      typeof window !== "undefined"
        ? window.matchMedia?.("(display-mode: standalone)").matches
        : undefined,
  };
  return { ...base, ...properties };
}

// Simple safe analytics wrapper
export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    if (!ANALYTICS_ENABLED) {
      console.log(
        "[Analytics] Analytics is disabled. Event not tracked: ",
        event,
        properties,
      );
      return;
    }

    try {
      amplitudeTrack(event, addCommonProps(properties));
    } catch (error) {
      console.warn("Analytics failed:", error);
    }
  },

  trackWithDedupe: (
    event: string,
    dedupeKey: string,
    properties?: Record<string, unknown>,
  ) => {
    if (!ANALYTICS_ENABLED) {
      console.log(
        "[Analytics] Analytics is disabled. Event not tracked with dedupe: ",
        event,
        dedupeKey,
        properties,
      );
      return;
    }

    try {
      // Use Amplitude's insert_id for event de-duplication
      amplitudeTrack(event, addCommonProps(properties), {
        insert_id: dedupeKey,
      });
    } catch (error) {
      console.warn("Analytics failed:", error);
    }
  },

  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (!ANALYTICS_ENABLED) {
      console.log(
        "[Analytics] Analytics is disabled. User not identified: ",
        userId,
        traits,
      );
      return;
    }

    try {
      setUserId(userId);
      if (traits && Object.keys(traits).length > 0) {
        const identity = new Identify();
        for (const [key, value] of Object.entries(traits)) {
          if (value === undefined || value === null) continue;
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            identity.set(key, value);
            continue;
          }
          if (Array.isArray(value)) {
            const filtered = value.filter(
              (v) => typeof v === "string" || typeof v === "number",
            ) as Array<string | number>;
            if (filtered.length > 0) identity.set(key, filtered);
          }
        }
        amplitudeIdentify(identity);
      }
    } catch (error) {
      console.warn("Analytics identify failed:", error);
    }
  },
};

// Simple event names
export const EVENTS = {
  // App-level lifecycle
  APP: "app",

  // Transactional flows
  TRANSACTION: "transaction",
  VERIFICATION: "verification",
  WALLET: "wallet",

  // Feature/section-scoped
  HELP: "help",
  SETTINGS: "settings",
  PWA: "pwa",
  REFERRAL: "referral",
  NAVIGATION: "navigation",
  FEATURE: "feature",
} as const;
