const CACHE = 'mahiyanganaya-v8';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './translations.js',
  './scroll-guide.js',
  './404.html',
  './public/logo.png',
  './attractions/mahiyangana-raja-maha-viharaya.html',
  './attractions/sorabora-wewa.html',
  './attractions/dambana-vedda-village.html',
  './attractions/mahaweli-and-nature-trails.html',
  './attractions/besama-natural-pool.html',
  './attractions/mapakada-lake.html',
  './attractions/ulhitiya-reservoir.html',
  './attractions/nagadeepa-viharaya.html',
  './attractions/rathna-ella-falls.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Cache-first for same-origin assets
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });
        return cached || networkFetch;
      })
    );
  } else {
    // Network-first with cache fallback for external resources
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
