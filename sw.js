const CACHE='libreta-digital-4-7-pwa-v5-rescate';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('libreta-digital-') && key !== CACHE)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheKey) {
  try {
    const response = await fetch(request, {cache:'no-store'});
    const cache = await caches.open(CACHE);
    cache.put(cacheKey || request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(cacheKey || request, {ignoreSearch:true});
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html').catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(event.request, {ignoreSearch:true})
      .then(cached => cached || networkFirst(event.request))
      .catch(() => caches.match('./index.html'))
  );
});
