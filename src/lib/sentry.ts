import {
  browserTracingIntegration,
  captureException,
  init,
  replayIntegration,
  setUser,
  startSpan,
} from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENVIRONMENT,
    sendDefaultPii: true,
    integrations: [browserTracingIntegration(), replayIntegration()],
    tracesSampleRate:
      import.meta.env.VITE_ENVIRONMENT === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [
      /^https?:\/\/(?:.*\.)?p2p\.(me|lol)$/,
      /^https?:\/\/user-app-v2\.netlify\.app$/,
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Enable logging
    _experiments: {
      enableLogs: true,
    },

    // Filter out noise
    beforeSend: (event, hint) => {
      // Skip user rejections
      if (
        hint.originalException instanceof Error &&
        hint.originalException.message.includes("User rejected the request")
      ) {
        return null;
      }

      // Skip development noise
      if (import.meta.env.DEV) {
        console.group("🔍 Sentry Error Preview");
        console.error("Error:", hint.originalException);
        console.groupEnd();
      }

      return event;
    },
  });
} else {
  console.warn("Sentry is not initialized. No DSN provided.");
}

/**
 * Simplified error capture with context
 */
export function captureError(
  error: unknown,
  context?: {
    operation?: string;
    component?: string;
    userId?: string;
    extra?: Record<string, unknown>;
  },
) {
  captureException(error, {
    tags: {
      domain: context?.operation,
      errorCode: context?.component,
    },
    extra: context?.extra,
    user: context?.userId ? { id: context.userId } : undefined,
  });
}

/**
 * Span helper for critical operations
 */
export function withSentrySpan<T>(
  operation: string,
  description: string,
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return startSpan({ op: operation, name: description }, callback);
}

/**
 * User identification for analytics
 */
export function identifyUser(
  address: string,
  additionalData?: Record<string, unknown>,
) {
  setUser({
    id: address,
    username: address,
    ...additionalData,
  });
}
