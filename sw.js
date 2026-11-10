// オフライン用: 一度開くと本体を端末に保存し、以後は通信なしで起動する
// 通信できる時は、いつも最新を取りにいく（更新が1回で反映される）。通信できない時は、保存済みを使う。
const CACHE = 'spray-angle-v7';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const net = new Promise((ok, ng) => {
      const to = setTimeout(() => ng(new Error('timeout')), 4000);
      fetch(e.request).then(r => { clearTimeout(to); ok(r); }, err => { clearTimeout(to); ng(err); });
    });
    try {
      const r = await net;
      if (r && r.ok) { c.put(e.request, r.clone()); return r; }
    } catch (_) { /* オフライン: 保存済みを使う */ }
    return (await c.match(e.request, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error();
  })());
});
