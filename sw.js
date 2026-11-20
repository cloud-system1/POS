
const CACHE = "veg-pos-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request)
    )
  );
});

