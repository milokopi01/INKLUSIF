/** ============================================================
 *  SERVICE WORKER — Sistem Saringan Murid (PWA)
 *  Fail: sw.js (1 daripada 4 fail utama)
 *  Strategi: Cache-first untuk aset statik, network-first untuk
 *  panggilan API Google Apps Script.
 * ============================================================ */

var CACHE_VERSION = 'saringan-v1.0.0';
var STATIC_CACHE  = CACHE_VERSION + '-static';
var API_CACHE     = CACHE_VERSION + '-api';

var STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ===== INSTALL: Precache aset statik =====
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ===== ACTIVATE: Buang cache lama =====
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== STATIC_CACHE && name !== API_CACHE;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ===== FETCH: Strategi berbeza untuk aset vs API =====
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Panggilan ke Google Apps Script — network-first, fallback ke cache
  if (url.hostname.indexOf('script.google.com') !== -1 || url.hostname.indexOf('googleapis.com') !== -1) {
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
    return;
  }

  // Aset statik — cache-first, fallback ke network
  if (event.request.method === 'GET') {
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
    return;
  }

  // Lain-lain: cuba network
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});

// ===== STRATEGI: Cache-First =====
function cacheFirstStrategy(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) {
        // Update cache di latar belakang
        fetch(request).then(function(resp) {
          if (resp && resp.status === 200) {
            cache.put(request, resp.clone());
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(request).then(function(resp) {
        if (resp && resp.status === 200) {
          cache.put(request, resp.clone());
        }
        return resp;
      }).catch(function() {
        // Fallback ke index.html untuk navigasi
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Luar talian - kandungan tidak tersedia', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    });
  });
}

// ===== STRATEGI: Network-First (untuk API) =====
function networkFirstStrategy(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return fetch(request).then(function(resp) {
      // Simpan respons API ke cache (hanya GET)
      if (resp && resp.status === 200 && request.method === 'GET') {
        cache.put(request, resp.clone());
      }
      return resp;
    }).catch(function() {
      // Fallback ke cache bila luar talian
      return cache.match(request).then(function(cached) {
        if (cached) return cached;
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Anda berada dalam mod luar talian. Data cache tidak tersedia untuk permintaan ini.'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });
  });
}

// ===== MESSAGE: Skip waiting untuk update =====
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
