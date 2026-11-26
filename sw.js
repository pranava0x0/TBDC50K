// Offline support for the self-contained race guide.
const CACHE = 'tb50k-v21';
const SHELL = new URL('./index.html', self.location.href).href;
const GPX = new URL('./route.gpx', self.location.href).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([SHELL, GPX])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tb50k-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (event.request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === new URL(SHELL).pathname)) {
    event.respondWith(fetch(event.request).then(async response => {
      if (response.ok) {const cache = await caches.open(CACHE); await cache.put(SHELL,response.clone());}
      return response;
    }).catch(() => caches.match(SHELL)));
  } else if (url.href === GPX) {
    event.respondWith(caches.match(GPX).then(cached => cached || fetch(event.request)));
  }
});
