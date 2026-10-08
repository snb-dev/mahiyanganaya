const CACHE = 'mahiyanganaya-v12';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './translations.js',
  './scroll-guide.js',
  './robots.txt',
  './sitemap.xml',
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
  './public/3D%20models/Parrot.glb',
  './public/vendor/three/three.min.js',
  './public/vendor/three/GLTFLoader.js',
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
  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  if (url.origin === self.location.origin) {
    if (isNavigation) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() =>
            caches.match(request)
              .then((cached) => cached || caches.match('./index.html'))
              .then((fallback) => fallback || caches.match('./404.html'))
          )
      );
      return;
    }

    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        }))
        .catch(() => caches.match('./404.html'))
    );
  } else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
  }
});
