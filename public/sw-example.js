// Example Service Worker with Auth Route Protection
// This file demonstrates how to properly handle auth routes in a custom service worker

const CACHE_NAME = 'app-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';

// Routes that should NEVER be handled by service worker
const AUTH_ROUTE_PATTERNS = [
  /\/api\/auth\/.*/,
  /\/auth\/.*/,
  /\/signin/,
  /\/signout/,
  /\/callback/,
  /supabase\.auth/,
  /\/_next\/.*/,
  /\/api\/.*/
];

// Check if a URL should bypass service worker
function shouldBypassServiceWorker(url) {
  const pathname = new URL(url).pathname;
  return AUTH_ROUTE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Only cache non-auth static assets
      return cache.addAll([
        '/',
        '/offline.html',
        // Add other static assets here, but NOT auth pages
      ].filter(url => !shouldBypassServiceWorker(url)));
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - handle requests with auth protection
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // CRITICAL: Skip service worker for auth routes
  if (shouldBypassServiceWorker(request.url)) {
    // Let the browser handle auth routes directly
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Don't cache responses with no-cache headers
        const cacheControl = response.headers.get('cache-control');
        if (cacheControl && cacheControl.includes('no-cache')) {
          return response;
        }
        
        // Clone the response for caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch((error) => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        throw error;
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear all caches if requested
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});