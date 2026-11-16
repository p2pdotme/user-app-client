type Amplitude = typeof import("@amplitude/analytics-browser");

// Simple Amplitude setup
const AMPLITUDE_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY;
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;
const ANALYTICS_ENABLED = AMPLITUDE_KEY !== undefined;

// The Amplitude SDK (~370 KB) is loaded as its own chunk, in parallel with the
// app starting up, instead of being parsed before the first screen can paint.
// Calls made before it has loaded are queued on the promise and keep their
// original timestamp.
let amplitudePromise: Promise<Amplitude> | null = null;

function loadAmplitude(): Promise<Amplitude> {
  if (!amplitudePromise) {
    amplitudePromise = import("@amplitude/analytics-browser").then(
      (amplitude) => {
        // No auto-capture/plugins by default
        amplitude.init(AMPLITUDE_KEY, { defaultTracking: false });
        return amplitude;
      },
    );
  }
  return amplitudePromise;
}

if (ANALYTICS_ENABLED) {
  void loadAmplitude().catch((error) => {
    console.warn("Analytics failed to load:", error);
  });
}

function withAmplitude(run: (amplitude: Amplitude) => void, label: string) {
  loadAmplitude()
    .then(run)
    .catch((error) => console.warn(label, error));
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

    const eventProperties = addCommonProps(properties);
    const time = Date.now();
    withAmplitude(
      (amplitude) => amplitude.track(event, eventProperties, { time }),
      "Analytics failed:",
    );
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

    const eventProperties = addCommonProps(properties);
    const time = Date.now();
    // Use Amplitude's insert_id for event de-duplication
    withAmplitude(
      (amplitude) =>
        amplitude.track(event, eventProperties, { insert_id: dedupeKey, time }),
      "Analytics failed:",
    );
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

    withAmplitude((amplitude) => {
      amplitude.setUserId(userId);
      if (traits && Object.keys(traits).length > 0) {
        const identity = new amplitude.Identify();
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
        amplitude.identify(identity);
      }
    }, "Analytics identify failed:");
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
