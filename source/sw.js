/**
 * Travel Nexus - Progressive Web App Service Worker
 * Provides offline caching for static assets and resilient network fallbacks.
 */

const CACHE_NAME = 'travel-nexus-v1.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/pages.css',
  '/css/responsive.css',
  '/js/data.js',
  '/js/states-data.js',
  '/js/map.js',
  '/js/filters.js',
  '/js/planner.js',
  '/js/modals.js',
  '/js/states.js',
  '/js/host.js',
  '/js/auth.js',
  '/js/admin.js',
  '/js/router.js',
  '/js/chat.js',
  '/js/scroll-reveal.js',
  '/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache pre-caching partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // For API or External Calls, network-first
  if (request.url.includes('/api/') || request.url.includes('api.open-meteo.com') || request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first, fallback to network for static files
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
