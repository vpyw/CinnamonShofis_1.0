/* Caché de archivos estáticos para modo sin conexión.
   Cambia el número de versión cuando publiques actualizaciones importantes. */
const CACHE_NAME = 'cinnamonshofis-app-v1';
const OFFLINE_ASSETS = [
  './', './index.html', './styles.css', './app.js', './favicon.svg',
  './icon-192.png', './icon-512.png', './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cinnamonshofis-app-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
  } else {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
