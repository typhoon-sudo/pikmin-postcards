const CACHE_NAME = 'pikmin-vault-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pikminlogo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache Cloudflare Worker API requests
  if (url.hostname === 'pikmin-api.typhoonnerd.workers.dev') {
    return;
  }

  // Network-First for HTML navigation so devices always receive code updates
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First for static icons/manifest
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
