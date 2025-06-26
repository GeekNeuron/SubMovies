// service-worker.js (Located in the project root)

const CACHE_NAME = 'submovies-cache-v5-landings'; // Incremented cache version

// Files to cache. Paths are relative to the service worker's location (root).
const CORE_FILES_TO_CACHE = [
  '/', // Alias for index.html
  'index.html',
  'manifest.json',
  'favicon.svg',
  'favicon.ico',
  'src/css/main.css',
  'src/js/main.js',
  // Key JS modules
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
  // Language files
  'src/lang/en.json?v=app_rev_2_src',
  'src/lang/fa.json?v=app_rev_2_src',
];

// ✅ FIX: Added landing pages to be cached for a better offline PWA experience.
const LANDING_PAGES_TO_CACHE = [
   'landing/en/index.html',
   'landing/fa/index.html',
   'landing/es/index.html',
   'landing/fr/index.html',
   'landing/de/index.html',
   'landing/ru/index.html',
   'landing/pt/index.html',
   'landing/tr/index.html',
   'landing/ar/index.html',
   'landing/hi/index.html',
   'landing/zh/index.html',
   'landing/ja/index.html',
   'landing/ko/index.html',
];

const FILES_TO_CACHE = [...CORE_FILES_TO_CACHE, ...LANDING_PAGES_TO_CACHE];

self.addEventListener('install', event => {
  console.log(`[ServiceWorker] Install - ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell:', FILES_TO_CACHE);
        const promises = FILES_TO_CACHE.map(fileUrl => {
            return cache.add(fileUrl).catch(err => {
                console.warn(`[ServiceWorker] Failed to cache ${fileUrl}:`, err);
            });
        });
        return Promise.all(promises);
      })
      .then(() => {
          console.log('[ServiceWorker] All specified files attempted to cache.');
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log(`[ServiceWorker] Activate - ${CACHE_NAME}`);
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
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

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
            if (cachedResponse) return cachedResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(error => {
          console.error(`[ServiceWorker] Network fetch failed for local asset ${event.request.url}: ${error.message}`);
          if (event.request.mode === 'navigate') {
            // This handles direct navigation to landing pages as well
            const path = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
            return caches.match(path) || caches.match('index.html');
          }
        });
      })
  );
});
