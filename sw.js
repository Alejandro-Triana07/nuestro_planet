// ─────────────────────────────────────────────────────────────────────────────
// sw.js — Service Worker · Nuestro Planeta PWA
// Estrategia:
//   · Shell de la app (HTML, CSS, JS, fuentes) → Cache First
//   · Peticiones a la API de TMDB              → Network First (con fallback a caché)
//   · Imágenes de TMDB                         → Cache First (con expiración implícita)
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_SHELL   = "np-shell-v1";
const CACHE_API     = "np-api-v1";
const CACHE_IMAGES  = "np-images-v1";

const MAX_API_ENTRIES    = 60;
const MAX_IMAGE_ENTRIES  = 120;

// Recursos del shell que se pre-cachean en la instalación
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./manifest.json",
  // Fuentes de Google (se cachean en tiempo de ejecución; aquí las incluimos
  // por si el SW las intercepta antes del primer render)
];

// ── Instalación: pre-carga el shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activa el nuevo SW sin esperar a que se cierren las pestañas existentes
  self.skipWaiting();
});

// ── Activación: limpia cachés obsoletas ──────────────────────────────────────
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_SHELL, CACHE_API, CACHE_IMAGES];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: enrutado por tipo de recurso ──────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptamos GET
  if (request.method !== "GET") return;

  // 1. Imágenes de TMDB → Cache First
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(request, CACHE_IMAGES, MAX_IMAGE_ENTRIES));
    return;
  }

  // 2. API de TMDB → Network First (offline fallback a caché)
  if (url.hostname === "api.themoviedb.org") {
    event.respondWith(networkFirst(request, CACHE_API, MAX_API_ENTRIES));
    return;
  }

  // 3. Fuentes de Google Fonts → Cache First
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // 4. Shell de la app (HTML / CSS / JS / mismo origen) → Cache First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ESTRATEGIAS DE CACHÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache First: sirve desde caché; si no está, va a red y guarda.
 * @param {Request} request
 * @param {string}  cacheName
 * @param {number}  [maxEntries]
 */
async function cacheFirst(request, cacheName, maxEntries) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (maxEntries) await trimCache(cache, maxEntries);
    }
    return response;
  } catch {
    // Sin red y sin caché: respuesta vacía con 503
    return new Response("Recurso no disponible sin conexión.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * Network First: intenta red; si falla, sirve desde caché.
 * @param {Request} request
 * @param {string}  cacheName
 * @param {number}  [maxEntries]
 */
async function networkFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (maxEntries) await trimCache(cache, maxEntries);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: "Sin conexión y sin datos en caché." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Elimina las entradas más antiguas cuando la caché supera maxEntries.
 * @param {Cache}  cache
 * @param {number} maxEntries
 */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Borra desde el más antiguo (FIFO)
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}