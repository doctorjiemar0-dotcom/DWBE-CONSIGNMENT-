const CACHE_NAME = 'whisk-portal-v3';

const OFFLINE_FILES = [
  './index.html',
  './manifest.json'
];

/* ================================
   INSTALL
   ================================ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_FILES))
      .then(() => self.skipWaiting())
  );
});


/* ================================
   ACTIVATE
   ================================ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});


/* ================================
   FETCH
   ================================ */
self.addEventListener('fetch', event => {

  const request = event.request;

  /*
   * HTML / PAGE
   * NETWORK FIRST
   *
   * Laging susubukan munang kunin
   * ang pinakabagong index.html sa server.
   */
  if (
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {

          if (response && response.ok) {

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

          }

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse ||
                caches.match('./index.html');
            });
        })
    );

    return;
  }


  /*
   * MANIFEST
   */
  if (request.url.includes('manifest.json')) {

    event.respondWith(
      fetch(request)
        .then(response => {

          if (response && response.ok) {

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

          }

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }


  /*
   * OTHER FILES
   *
   * Cache first, then network.
   */
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {

            if (
              response &&
              response.status === 200 &&
              response.type === 'basic'
            ) {

              const responseClone = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });

            }

            return response;
          });

      })
  );

});
