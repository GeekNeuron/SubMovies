const CACHE_NAME = 'submovies-cache-v2'; // Incremented cache version
const CORE_FILES_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'script.js?v=final_v2', // Ensure version matches HTML
  'favicon.svg',
  'favicon.ico',
  // Add language files
  'lang/en.json?v=1',
  'lang/fa.json?v=1',
  // Add other lang files if you want them pre-cached, e.g., 'lang/es.json?v=1', etc.
  // For Tailwind CSS - Option 1: If you decide to host it locally
  // 'styles/tailwind.min.css', 
  // For Tailwind CSS - Option 2: If using CDN, caching it is more complex
  // due to opaque responses. Consider local hosting for full offline.
];

// For landing pages, if you want them cached:
const LANDING_PAGES_TO_CACHE = [
  // 'landing/en/index.html', // Example, adjust paths as per your generate.js
  // 'landing/fa/index.html',
];

const FILES_TO_CACHE = [...CORE_FILES_TO_CACHE, ...LANDING_PAGES_TO_CACHE];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching files:', FILES_TO_CACHE);
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache files during install:', error);
      })
  );
  self.skipWaiting(); // Force new SW to activate immediately
});

self.addEventListener('fetch', event => {
  // For CDN resources like Tailwind, a network-first or stale-while-revalidate
  // might be better if not hosted locally.
  // For local assets, cache-first is fine.
  if (event.request.url.startsWith('https://cdn.jsdelivr.net')) {
    // Example: Stale-while-revalidate for CDN
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          console.warn(`Fetch failed for ${event.request.url}; returning cached response if available. Error: ${err.message}`);
          return cachedResponse; // Return cached if network fails
        });
        return cachedResponse || fetchedResponsePromise;
      })
    );
  } else {
    // Cache-first for local assets
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }) // ignoreSearch for query params like ?v=1
        .then(resp => resp || fetch(event.request)
        .catch(err => {
            // Fallback for navigation requests if offline and not cached
            if (event.request.mode === 'navigate' && !resp) {
                // return caches.match('offline.html'); // You'd need an offline.html page
            }
            console.error(`Fetch failed for ${event.request.url} and no cache match. Error: ${err.message}`);
        }))
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  return self.clients.claim(); // Ensure new SW controls clients immediately
});
