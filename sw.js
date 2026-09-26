/* Service worker: makes Fridge work offline.

   - App files are pre-cached on install and served from the cache
     instantly; a fresh copy is fetched in the background, so edits you
     publish show up on the next launch.
   - The text-reader library (Tesseract, from cdn.jsdelivr.net) and product
     photos are cached the first time they're used.
   - Open Food Facts lookups always go to the network (nothing to cache).

   If you add or rename app files, add them to APP_FILES and bump VERSION. */

const VERSION = 'v0.2';
const APP_CACHE = `fridge-app-${VERSION}`;
const RUNTIME_CACHE = 'fridge-runtime';

const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/db.js',
  'js/defaults.js',
  'js/i18n.js',
  'js/icons.js',
  'js/ics.js',
  'js/ocr.js',
  'js/recipes.js',
  'js/rules.js',
  'js/scanner.js',
  'js/utils.js',
  'lib/html5-qrcode.min.js',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('fridge-app-') && k !== APP_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Cache first, refresh in the background ("stale-while-revalidate"). */
async function staleWhileRevalidate(request, cacheName, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
  const network = fetch(request).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const res = await network;
  if (res) return res;
  // Offline and not cached: fall back to the app shell for page loads.
  if (request.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
  return Response.error();
}

/* Cache first, never re-fetch (versioned CDN files and product photos). */
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE, event));
  } else if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'images.openfoodfacts.org') {
    event.respondWith(cacheFirst(request));
  }
  // Everything else (e.g. the Open Food Facts API) goes straight to the network.
});
