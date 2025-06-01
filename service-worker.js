// service-worker.js (Located in the project root)

const CACHE_NAME = 'submovies-cache-v4-modular-src-lang'; // Incremented cache version

// Files to cache. Paths are relative to the service worker's location (root).
const CORE_FILES_TO_CACHE = [
  '/', // Alias for index.html
  'index.html',
  'manifest.json',
  'favicon.svg',
  'favicon.ico',
  'src/css/main.css', // Path to main CSS file
  'src/js/main.js',   // Main JS entry point
  // Key JS modules (cache more based on import graph or if critical for offline shell)
  'src/js/core/i18nService.js',
  'src/js/core/themeService.js',
  'src/js/core/apiService.js',
  'src/js/core/subtitleParser.js',
  'src/js/core/toastService.js',
  'src/js/ui/domElements.js',
  'src/js/ui/settingsController.js',
  'src/js/ui/fileController.js',
  'src/js/ui/translationController.js',
  'src/js/utils/constants.js',
  'src/js/utils/helpers.js',
  // Language files (path updated to src/lang/)
  'src/lang/en.json?v=app_rev_2_src', // Add version query for cache busting
  'src/lang/fa.json?v=app_rev_2_src',
  // Vazirmatn font files from Google Fonts are typically handled by browser cache
  // and service worker network-first strategy for CDN resources.
];

// Optional: Landing pages if they exist and need offline access
// const LANDING_PAGES_TO_CACHE = [
//   // 'landing/en/index.html', // Example, adjust if landing pages are generated
//   // 'landing/fa/index.html',
// ];

const FILES_TO_CACHE = [...CORE_FILES_TO_CACHE]; // Add LANDING_PAGES_TO_CACHE if used

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install - v4-modular-src-lang');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell:', FILES_TO_CACHE);
        // Cache files one by one to identify which one fails if addAll fails
        const promises = FILES_TO_CACHE.map(fileUrl => {
            return cache.add(fileUrl).catch(err => {
                console.warn(`[ServiceWorker] Failed to cache ${fileUrl}:`, err);
            });
        });
        return Promise.all(promises); // Wait for all (even failed ones) to proceed
      })
      .then(() => {
          console.log('[ServiceWorker] All specified files attempted to cache.');
      })
  );
  self.skipWaiting(); // Activate the new service worker immediately
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate - v4-modular-src-lang');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Take control of all open clients
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy for Google Fonts & Tailwind CDN: Stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'cdn.tailwindcss.com') {
    
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(fetchError => {
            console.warn(`[ServiceWorker] Network fetch failed for CDN ${event.request.url}: ${fetchError.message}`);
            if (cachedResponse) return cachedResponse; // Serve from cache if network fails
            // If not in cache and network fails, let browser handle (will show error)
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache-first strategy for local assets (app shell)
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }) // ignoreSearch for query params
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, fetch from network.
        // For the app shell, we generally expect all files to be pre-cached.
        // If a file is requested that wasn't in FILES_TO_CACHE, it will be fetched.
        // You might not want to cache these dynamically fetched local resources unless intended.
        return fetch(event.request).then(networkResponse => {
            // Example: Only cache successful responses for JS/CSS/JSON from your own origin
            // if (networkResponse.ok && 
            //     (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json')) && 
            //     url.origin === self.location.origin) {
            //     const responseToCache = networkResponse.clone();
            //     caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
            // }
            return networkResponse;
        }).catch(error => {
          console.error(`[ServiceWorker] Network fetch failed for local asset ${event.request.url}: ${error.message}`);
          // Fallback for navigation requests (e.g., navigating to index.html directly)
          if (event.request.mode === 'navigate' && (event.request.url.endsWith('/') || event.request.url.endsWith('index.html'))) {
            return caches.match('index.html'); // Serve index.html if navigation fails
          }
          // For other assets, let the browser handle the network error.
        });
      })
  );
});
