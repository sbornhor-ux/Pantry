// v7 — Network-first: always fetch latest from GitHub, cache as offline fallback
var CACHE = 'pantry-v7';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Delete all old caches
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // Network first: try to get fresh version, cache it, fall back to cache if offline
  e.respondWith(
    fetch(e.request).then(function(response) {
      // Got a fresh response — cache it for offline use
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(e.request).then(function(cached) {
        return cached || new Response('Offline — please reconnect', {
          status: 503, headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
