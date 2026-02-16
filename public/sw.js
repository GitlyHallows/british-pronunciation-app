const CACHE_NAME = "british-pronunciation-static-v2";
const STATIC_ASSETS = ["/manifest.webmanifest", "/icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        STATIC_ASSETS.map((asset) =>
          fetch(asset, { cache: "no-store" })
            .then((response) => {
              if (response.ok) {
                return cache.put(asset, response.clone());
              }
              return null;
            })
            .catch(() => null)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Never cache-route HTML navigations. Always fetch live app content.
  if (event.request.mode === "navigate") {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    STATIC_ASSETS.includes(url.pathname);

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
