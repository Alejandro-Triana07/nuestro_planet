const CACHE_SHELL  = "np-shell-v2";
const CACHE_API    = "np-api-v1";
const CACHE_IMAGES = "np-images-v1";
const MAX_API_ENTRIES   = 60;
const MAX_IMAGE_ENTRIES = 120;
const SHELL_ASSETS = ["./", "./index.html", "./style.css", "./main.js", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_SHELL, CACHE_API, CACHE_IMAGES];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !currentCaches.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (url.hostname === "image.tmdb.org") { event.respondWith(cacheFirst(request, CACHE_IMAGES, MAX_IMAGE_ENTRIES)); return; }
  if (url.hostname === "api.themoviedb.org") { event.respondWith(networkFirst(request, CACHE_API, MAX_API_ENTRIES)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { event.respondWith(cacheFirst(request, CACHE_SHELL)); return; }
  if (url.origin === self.location.origin) { event.respondWith(cacheFirst(request, CACHE_SHELL)); return; }
});

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) { await cache.put(request, response.clone()); if (maxEntries) await trimCache(cache, maxEntries); }
    return response;
  } catch { return new Response("Recurso no disponible sin conexión.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
}

async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) { await cache.put(request, response.clone()); if (maxEntries) await trimCache(cache, maxEntries); }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Sin conexión y sin datos en caché." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) { const toDelete = keys.slice(0, keys.length - maxEntries); await Promise.all(toDelete.map((k) => cache.delete(k))); }
}