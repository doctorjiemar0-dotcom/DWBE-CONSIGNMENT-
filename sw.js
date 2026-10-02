// Doctor's Whisk Broom - Service Worker
// I-BUMP ang VERSION tuwing may bagong release ng index.html
const VERSION = '2026.10.01-4';
const CACHE = 'dwbe-' + VERSION;
const FILES = ['index.html', 'manifest.json'];

async function getPointer() {
  const m = await caches.open('dwbe-meta');
  const r = await m.match('current');
  return r ? r.text() : null;
}
async function setPointer(v) {
  const m = await caches.open('dwbe-meta');
  await m.put('current', new Response(v));
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const f of FILES) {
      try { await c.add(new Request(f, { cache: 'reload' })); } catch (err) {}
    }
    if (!(await getPointer())) await setPointer(CACHE); // unang install lang
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // tanggalin ang lumang cache ng dating sw.js
    for (const k of await caches.keys()) { if (k === 'whisk-portal-v3') await caches.delete(k); }
    await self.clients.claim();
  })());
});

// Ang app files ay galing sa bersyong PINILI ng client. Ang data (Firebase) ay laging live.
self.addEventListener('fetch', (e) => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  if (req.mode === 'navigate' && u.pathname.endsWith('admin.html')) return;
  e.respondWith((async () => {
    const cur = await getPointer();
    if (cur) {
      const c = await caches.open(cur);
      const hit = await c.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreSearch: true });
      if (hit) return hit;
    }
    return fetch(req);
  })());
});

self.addEventListener('message', (e) => {
  e.waitUntil((async () => {
    if (e.data === 'CHECK') {
      const cur = await getPointer();
      e.source.postMessage({ type: 'STATUS', update: cur !== CACHE });
    }
    if (e.data === 'APPLY') {
      await setPointer(CACHE);
      for (const k of await caches.keys()) {
        if (k !== CACHE && k !== 'dwbe-meta') await caches.delete(k);
      }
      for (const c of await self.clients.matchAll()) c.postMessage({ type: 'APPLIED' });
    }
  })());
});
