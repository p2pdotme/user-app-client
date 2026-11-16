/**
 * After a deploy, a tab that was opened on the previous version still asks
 * for that version's lazily loaded files (route pages, the QR scanner, a
 * language). They no longer exist, so the import fails and the user would land
 * on the full-screen error page. Reloading picks up the new version, so do
 * that once, quietly, instead.
 *
 * Guarded so a genuinely broken deploy (or being offline) can't cause a
 * reload loop: at most one automatic reload per 30 seconds per tab. After
 * that the error is left to the normal error page.
 */
const STORAGE_KEY = "p2p:stale-chunk-reload-at";
const MIN_INTERVAL_MS = 30_000;

let reloadPending = false;

/** True once an automatic reload has been started in this page. */
export function isStaleChunkReloadPending() {
  return reloadPending;
}

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

/**
 * Reloads the page if it hasn't auto-reloaded in the last 30 s. Returns
 * whether a reload was started.
 */
export function reloadForStaleChunk({
  storage = safeSessionStorage(),
  now = Date.now(),
  reload = () => window.location.reload(),
}: {
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
  now?: number;
  reload?: () => void;
} = {}): boolean {
  if (!navigator.onLine) return false;
  const last = Number(storage?.getItem(STORAGE_KEY) ?? 0);
  if (now - last < MIN_INTERVAL_MS) return false;
  storage?.setItem(STORAGE_KEY, String(now));
  reloadPending = true;
  reload();
  return true;
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Registers the Vite hook. Call once, before the app renders. The error is
 * not swallowed: it still reaches the error boundary, which stays blank (and
 * skips Sentry) while the reload is pending.
 */
export function installStaleChunkReload() {
  window.addEventListener("vite:preloadError", () => {
    reloadForStaleChunk();
  });
}
