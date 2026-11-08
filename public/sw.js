const CACHE_NAME = 'puffinless-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
  '/fonts/plus-jakarta-sans-latin.woff2',
  '/fonts/space-grotesk-latin.woff2'
];

/** Strictly limits caching to known immutable static asset types */
function isStaticAsset(request, url) {
  if (url.origin !== self.location.origin) return false;

  // Explicit static pre-cache list
  if (STATIC_ASSETS.includes(url.pathname)) return true;

  // Bundled assets and fonts directories
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    return true;
  }

  // Request destinations for static resources
  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    return true;
  }

  // Explicit static file extensions (never cache dynamic endpoints, APIs, or query payloads)
  return /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|ico|webp|webmanifest)$/i.test(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`Failed to pre-cache ${url}:`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Strictly delete only older PuffinLess caches, preserve other origins/apps
          if (key.startsWith('puffinless-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // For navigation requests (HTML pages), try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response('PuffinLess Offline - Please reload when connected.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // Strictly filter: only cache confirmed static assets; ignore all dynamic or API requests
  const url = new URL(event.request.url);
  if (!isStaticAsset(event.request, url)) {
    return;
  }

  // Stale-while-revalidate strictly for immutable static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
