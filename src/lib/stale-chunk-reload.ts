/**
 * After a deploy, a tab that was opened on the previous version still asks
 * for that version's lazily loaded route pages. They no longer exist, so the
 * import fails and the error boundary would show the full-screen error page.
 * Reloading picks up the new version, so the boundary does that once instead
 * (see components/error-boundary.tsx).
 *
 * Only errors that reach the error boundary trigger this: a failed import that
 * the code already handles (the QR decoder, a language file, Amplitude, the
 * Farcaster SDK) never reloads the app.
 *
 * Guarded so a genuinely broken deploy can't cause a reload loop: at most one
 * automatic reload per 30 seconds per tab, none while offline, and none at all
 * when sessionStorage can't be used (blocked storage, some embedded
 * webviews), since the guard couldn't be enforced there. In those cases the
 * normal error page shows, with its Reload button.
 */
const STORAGE_KEY = "p2p:stale-chunk-reload-at";
const MIN_INTERVAL_MS = 30_000;

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chrome
  /error loading dynamically imported module/i, // Firefox
  /Importing a module script failed/i, // Safari
  /Unable to preload CSS/i, // Vite CSS preload
];

export function isStaleChunkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

type GuardStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Reloads the page unless it already auto-reloaded in the last 30 s. Returns
 * whether a reload was started.
 */
export function reloadForStaleChunk({
  storage = safeSessionStorage(),
  now = Date.now(),
  online = typeof navigator === "undefined" ? true : navigator.onLine,
  reload = () => window.location.reload(),
}: {
  storage?: GuardStorage | null;
  now?: number;
  online?: boolean;
  reload?: () => void;
} = {}): boolean {
  if (!online || !storage) return false;
  try {
    const last = Number(storage.getItem(STORAGE_KEY) ?? 0);
    if (now - last < MIN_INTERVAL_MS) return false;
    // If this write fails, the guard can't hold: don't reload.
    storage.setItem(STORAGE_KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}

function safeSessionStorage(): GuardStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
