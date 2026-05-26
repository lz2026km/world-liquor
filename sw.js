const CACHE_NAME = 'world-liquor-v5-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/animations.css',
  '/data.js',
  '/ui.js',
  '/particle.js'
];

const DATA_ASSETS = [
  '/baijiu_data.json'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy:
// - Static assets: cache-first
// - Data JSON: network-first with cache fallback
// - Images: cache-first with network fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isData = DATA_ASSETS.some(p => url.pathname.endsWith(p.replace('/', '')));
  const isImage = url.pathname.startsWith('/images/') || /\.(jpg|jpeg|png|webp)$/i.test(url.pathname);

  if (STATIC_ASSETS.some(p => url.pathname.endsWith(p.replace('/', '')))) {
    // Static: cache first
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      }))
    );
  } else if (isData) {
    // Data: network first, fallback cache
    event.respondWith(
      fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      }).catch(() => caches.match(event.request))
    );
  } else if (isImage) {
    // Images: cache first
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      }))
    );
  }
});