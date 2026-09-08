/* =========================================================
   DOCTOR'S WHISK BROOM - SERVICE WORKER
========================================================= */

const CACHE_NAME = 'whisk-broom-v2'; // Tinaas ang version para ma-clear ang luma
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

/* =========================================================
   INSTALL EVENT
========================================================= */

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.log('⚠️ Caching failed:', err);
      })
  );
});

/* =========================================================
   ACTIVATE EVENT
========================================================= */

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH EVENT - STALE-WHILE-REVALIDATE / NETWORK FIRST
========================================================= */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Only handle GET requests */
  if (request.method !== 'GET') return;

  /* Skip cross-origin requests */
  if (url.origin !== location.origin) return;

  /* Para sa HTML/Navigation requests: Network First, fallback to index.html/cache */
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match('./index.html').then((cachedResponse) => {
            return cachedResponse || caches.match(request);
          });
        })
    );
    return;
  }

  /* Para sa ibang assets (CSS, JS, Images): Cache First, fallback to Network */
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent fail kung offline at walang network
      });

      return cachedResponse || fetchPromise;
    })
  );
});

/* =========================================================
   MESSAGE HANDLER - FOR PWA UPDATES
========================================================= */

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⚡ Skipping waiting - activating new service worker');
    self.skipWaiting();
  }
});
