// Offline cache: everything the app needs is saved on first visit.
// Bump VERSION whenever files change so phones pick up the update.
const VERSION = 'cruise-v20';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json', 'words.js', 'defs.js', 'core.js', 'fx.js', 'facts.js', 'flight.js', 'passport.js', 'vendor/zxing.min.js', 'vendor/zxing-wasm.js', 'vendor/zxing_reader.wasm', 'mywords.js', 'unicorn.js', 'img/dog1.png', 'img/dog2.png', 'img/dog3.png', 'surprise.enc.js', 'tia.js',
  'games/wordle.js', 'games/wheel.js', 'games/blocks.js', 'games/fruit.js', 'games/mysteries-data.js', 'games/mystery.js', 'games/wordsearch.js', 'games/sudoku.js', 'games/merge.js', 'games/bubbles.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first (so updates show up straight away), falling back to the saved copy when offline.
// A 3-second timeout stops slow airport Wi-Fi from making the app hang.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await Promise.race([
        fetch(e.request, { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || (await cache.match('index.html'));
    }
  })());
});
