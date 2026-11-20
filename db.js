
const CACHE = "veg-pos-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./manifest.webmanifest"
];

// Install the updated POS files.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

// Remove only outdated Cache Storage entries.
// IndexedDB sales and pending transactions are untouched.
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

// Handle network and offline access.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API requests must never be cached.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      try {
        // Use the latest available version.
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        // Offline fallback.
        const cached = await cache.match(request);

        if (cached) return cached;

        if (request.mode === "navigate") {
          const offlinePage = await cache.match("./index.html");

          if (offlinePage) return offlinePage;
        }

        return Response.error();
      }
    })()
  );
});
