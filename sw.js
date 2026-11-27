
const CACHE = "veg-pos-offline-recovery-v10";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./cashier-shifts.js",
  "./manifest.webmanifest"
];

const BASE = self.registration.scope;

const CASHIER_URL = new URL("./", BASE).href;
const INDEX_URL = new URL("./index.html", BASE).href;

const ALLOWED_PATHS = new Set(
  ASSETS.map(asset => new URL(asset, BASE).pathname)
);

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("veg-pos-") && key !== CACHE
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Never cache API requests.
  if (url.pathname.startsWith("/api/")) return;

  // Only explicitly approved cashier assets.
  // Admin and login pages are excluded.
  if (!ALLOWED_PATHS.has(url.pathname)) return;

  const isCashierNavigation =
    request.mode === "navigate" &&
    (
      url.pathname === new URL(CASHIER_URL).pathname ||
      url.pathname === new URL(INDEX_URL).pathname
    );

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      try {
        const response = await fetch(request);

        if (response.ok && !response.redirected) {
          await cache.put(request, response.clone());
        }

        return response;

      } catch {

        // Restore cashier page regardless of URL parameters.
        if (isCashierNavigation) {
          const offlinePage =
            await cache.match(CASHIER_URL) ||
            await cache.match(INDEX_URL);

          if (offlinePage) return offlinePage;
        }

        const cached = await cache.match(request);

        if (cached) return cached;

        return Response.error();
      }
    })()
  );
});
