const CACHE_NAME = 'whisk-portal-v4';
const urlsToCache = ['./index.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.all(urlsToCache.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/admin.html') || url.pathname.includes('/api/')) return;
  const isPage = e.request.mode === 'navigate';
  const known = urlsToCache.some(u => url.pathname.endsWith(u.slice(1)));
  if (!isPage && !known) return;
  e.respondWith(
    caches.match('./index.html', { ignoreSearch: true }).then(hit =>
      (isPage ? hit : caches.match(e.request)) || fetch(e.request)
    )
  );
});

self.addEventListener('message', async e => {
  const src = e.source;
  const cache = await caches.open(CACHE_NAME);
  let fresh = null;
  try { fresh = await fetch('./index.html', { cache: 'no-store' }); } catch (_) {}
  if (e.data === 'CHECK') {
    let update = false;
    const old = await cache.match('./index.html');
    if (fresh && fresh.ok) {
      if (old) update = (await old.clone().text()) !== (await fresh.clone().text());
      else await cache.put('./index.html', fresh.clone());
    }
    src.postMessage({ type: 'STATUS', update });
  }
  if (e.data === 'APPLY') {
    if (fresh && fresh.ok) await cache.put('./index.html', fresh.clone());
    src.postMessage({ type: 'APPLIED' });
  }
});
