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

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST);

// clean old assets
cleanupOutdatedCaches();

let allowlist: RegExp[] | undefined;
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV) allowlist = [/^\/$/];

// to allow work offline
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist }),
);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => clientsClaim());

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

// Already called above in install/activate
