// Offline cache: everything the app needs is saved on first visit.
// Bump VERSION whenever files change so phones pick up the update.
const VERSION = 'cruise-v1';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json', 'words.js', 'core.js', 'flight.js',
  'games/wordle.js', 'games/wheel.js', 'games/blocks.js', 'games/fruit.js',
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

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match('index.html')))
  );
});
