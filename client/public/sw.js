const CACHE_NAME = 'lifeconnect-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/brand/pwa-192x192.png',
  '/brand/pwa-512x512.png',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler with offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        // Cache static assets dynamically
        if (
          networkResponse.status === 200 &&
          (event.request.url.includes('/brand/') || event.request.url.includes('/assets/'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for failed requests
        return null;
      });
    })
  );
});

// Web Push Notification Handler
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🩸 Life Connect Alert', body: event.data.text() };
    }
  }

  const title = data.title || '🩸 Life Connect Emergency Alert';
  const options = {
    body: data.body || 'A critical blood request was posted nearby.',
    icon: data.icon || '/brand/pwa-192x192.png',
    badge: data.badge || '/brand/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/requests' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click deep-link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/requests';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
