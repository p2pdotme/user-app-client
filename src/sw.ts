/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

const RUNTIME_CACHE = "app-assets-v1";

// Full build manifest injected by vite-plugin-pwa at build time.
const manifest = self.__WB_MANIFEST;
const urlOf = (entry: string | { url: string }) =>
  typeof entry === "string" ? entry : entry.url;

// Boot-critical shell (index.html + css). Kept tiny so the install event
// completes near-instantly and rarely fails on slow networks. Everything else
// is background-warmed after activation — Twitter-style: the update applies
// instantly, then full offline support fills in quietly afterwards.
const shell = manifest.filter((e) => {
  const url = urlOf(e);
  return url.endsWith(".html") || url.endsWith(".css");
});
const rest = manifest.filter((e) => !shell.includes(e));

// Atomic precache of ONLY the shell.
precacheAndRoute(shell);

// clean old precaches
cleanupOutdatedCaches();

let allowlist: RegExp[] | undefined;
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV) allowlist = [/^\/$/];

// to allow work offline
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist }),
);

// Runtime cache for same-origin build assets (JS chunks, images, fonts, and
// any css/js not precached). Vite content-hashes these filenames, so they are
// immutable — CacheFirst fetches each at most once. The ExpirationPlugin LRU
// evicts stale chunks from previous deploys automatically.
const assetStrategy = new CacheFirst({
  cacheName: RUNTIME_CACHE,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 500,
      maxAgeSeconds: 60 * 60 * 24 * 30,
      purgeOnQuotaError: true,
    }),
  ],
});

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "image" ||
      request.destination === "font"),
  assetStrategy,
);

// IMPORTANT: do NOT skipWaiting on install. A new deploy must not hijack an
// open session — that swaps in new code mid-session and makes route changes
// blank out when a lazy chunk with the old build's hash 404s. Instead the new
// SW stays in "waiting" and only takes over on the next cold start, or when the
// user explicitly hits "Reload" (which posts SKIP_WAITING below).
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      clientsClaim();

      // Background-warm the rest of the build so full offline works within
      // seconds of an update. Non-blocking for clients, per-asset via the
      // CacheFirst strategy: already-cached (unchanged-hash) files are skipped,
      // so only the changed delta is downloaded, and a single slow/failed
      // request never aborts the warm. Routing through assetStrategy keeps the
      // ExpirationPlugin's LRU accounting accurate.
      await Promise.allSettled(
        rest.map((entry) =>
          assetStrategy.handle({
            request: new Request(urlOf(entry)),
            event,
          }),
        ),
      );
    })(),
  );
});

// Runtime cache for CDN assets (images/audio/animations)
const CDN_ORIGIN = "https://firebasestorage.googleapis.com";
registerRoute(
  ({ url, request }) =>
    url.origin === CDN_ORIGIN &&
    url.pathname.startsWith("/v0/b/p2px-421205.appspot.com/o/user-app%2Fv2") &&
    (request.destination === "image" ||
      request.destination === "audio" ||
      request.destination === ""),
  new CacheFirst({
    cacheName: "cdn-assets-v2",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);
