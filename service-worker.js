// service-worker.js (Located in the project root)

const CACHE_NAME = 'submovies-cache-v3-modular'; // Incremented cache version

// Files to cache. Paths are relative to the service worker's location (root).
const CORE_FILES_TO_CACHE = [
  '/', // Alias for index.html
  'index.html',
  'manifest.json',
  'favicon.svg',
  'favicon.ico',
  'src/css/main.css',
  'src/js/main.js', // Main JS entry point
  // Key JS modules (consider caching more based on import graph or if critical)
  'src/js/core/i18nService.js',
  'src/js/core/themeService.js',
  'src/js/core/apiService.js',
  'src/js/ui/domElements.js',
  // Language files (assuming lang folder is in root as per user's confirmed structure)
  'lang/en.json?v=app_rev_1', // Add version query for cache busting
  'lang/fa.json?v=app_rev_1',
  // Add Vazirmatn font files if self-hosting, or rely on browser cache for Google Fonts
];

// Optional: Landing pages if they exist and need offline access
// const LANDING_PAGES_TO_CACHE = [
//   'landing/en/index.html', // Example, adjust if landing pages are generated
//   'landing/fa/index.html',
// ];

const FILES_TO_CACHE = [...CORE_FILES_TO_CACHE]; // Add LANDING_PAGES_TO_CACHE if used

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell:', FILES_TO_CACHE);
        return cache.addAll(FILES_TO_CACHE)
          .catch(error => {
            console.error('[ServiceWorker] Failed to cache files during install:', error);
            // Log which file failed if possible, addAll rejects on first failure
            // For more robust caching, cache files individually and ignore failures for non-critical assets
          });
      })
  );
  self.skipWaiting(); // Activate the new service worker immediately
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Take control of all open clients
});

self.addEventListener('fetch', event => {
  // console.log('[ServiceWorker] Fetching:', event.request.url);

  // For CDN resources like Tailwind or Google Fonts, a network-first or
  // stale-while-revalidate strategy is often preferred.
  if (event.request.url.startsWith('https://fonts.googleapis.com') ||
      event.request.url.startsWith('https://fonts.gstatic.com') ||
      event.request.url.startsWith('https://cdn.tailwindcss.com')) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          // Check if the response is valid before caching (e.g. status 200)
          if (networkResponse && networkResponse.ok) {
            // It's good practice to clone the response before caching and returning it
            // as a response can only be consumed once.
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Network request failed, try to serve from cache if available
          console.warn(`[ServiceWorker] Network fetch failed for ${event.request.url}, trying cache. Error: ${error.message}`);
          const cachedResponse = await cache.match(event.request);
          return cachedResponse || Response.error(); // Return error if not in cache either
        }
      })
    );
    return; // Important to return after handling the CDN request
  }

  // For local assets, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }) // ignoreSearch for query params like ?v=...
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('[ServiceWorker] Returning from cache:', event.request.url);
          return cachedResponse;
        }
        // console.log('[ServiceWorker] Not in cache, fetching from network:', event.request.url);
        return fetch(event.request).then(networkResponse => {
          // Optionally, cache newly fetched local resources if they weren't in FILES_TO_CACHE
          // but this can lead to caching unexpected things if not careful.
          // For now, we only pre-cache defined files.
          return networkResponse;
        }).catch(error => {
          console.error(`[ServiceWorker] Network fetch failed for local asset ${event.request.url}: ${error.message}`);
          // You could return a custom offline page here for navigation requests:
          // if (event.request.mode === 'navigate') {
          //   return caches.match('offline.html'); // Make sure 'offline.html' is cached
          // }
          // For other assets, just let the browser handle the error.
        });
      })
  );
});
