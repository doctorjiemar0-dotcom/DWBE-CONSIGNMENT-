/* =========================================================
   DOCTOR'S WHISK BROOM - SERVICE WORKER
========================================================= */

const CACHE_NAME = 'whisk-broom-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
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
        return cache.addAll(urlsToCache)
          .catch(err => {
            console.log('⚠️ Some resources could not be cached:', err);
            // Continue anyway - don't fail on caching errors
          });
      })
  );
  
  /* Force the waiting service worker to become the active service worker */
  self.skipWaiting();
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
    })
  );
  
  /* Immediately claim clients */
  return self.clients.claim();
});

/* =========================================================
   FETCH EVENT - NETWORK FIRST STRATEGY
========================================================= */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Only handle GET requests */
  if (request.method !== 'GET') {
    return;
  }

  /* Skip cross-origin requests */
  if (url.origin !== location.origin) {
    return;
  }

  /* Network first, fallback to cache */
  event.respondWith(
    fetch(request)
      .then((response) => {
        /* Only cache successful responses */
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        /* Clone the response */
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        /* Network request failed, try cache */
        return caches.match(request)
          .then((response) => {
            return response || new Response(
              '<h1>Offline</h1><p>No internet connection and page not cached.</p>',
              { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html'
                })
              }
            );
          });
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

console.log('✨ Service Worker loaded successfully');
