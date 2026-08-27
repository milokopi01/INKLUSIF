/* SPIB PPKI - Service Worker */
var CACHE_NAME = 'spib-ppki-v1';
var CACHE_FILES = [
  './',
  './index.html',
  './manifest.json'
];

/* INSTALL - Cache fail asas */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ACTIVATE - Bersihkan cache lama */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(name) {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* FETCH - Network First, Fallback to Cache */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Salin respons ke cache untuk fail aplikasi (bukan API Google Apps Script)
        var url = event.request.url;
        if (response && response.status === 200 && url.indexOf('script.google.com') === -1) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Ralat rangkaian - gunakan cache
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Fallback ke index.html untuk navigasi
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Luar talian - sumber tidak tersedia', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
