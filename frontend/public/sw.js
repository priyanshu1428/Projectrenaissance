/* Expedition Guardian service worker — app shell caching for offline use */
const SHELL_CACHE = "eg-shell-v1";
const RUNTIME_CACHE = "eg-runtime-v1";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // never cache API traffic
  if (url.pathname.startsWith("/api/")) return;

  // navigations: network first, fall back to cached shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL_CACHE).then((c) => c.put("/index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // static assets + fonts + leaflet css: cache first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (url.origin === self.location.origin || req.destination !== "")) {
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
