const CACHE_NAME = 'Whisk-portal-v3';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

// Install event: I-cache ang mga pangunahing files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: Burahin ang mga lumang cache (tulad ng v2) para lumabas ang bago
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-First Strategy (Laging uunahin ang bagong update mula sa GitHub kung may internet)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Huwag pakialaman ang mga external request (tulad ng Firebase API, Firestore, Auth, at CDNs)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Kung konektado sa internet, i-save ang bagong sagot sa cache at i-display
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Kung walang internet (offline), saka lamang gagamitin ang naka-save sa cache
        return caches.match(event.request);
      })
  );
});
