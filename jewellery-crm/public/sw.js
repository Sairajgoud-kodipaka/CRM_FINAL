// Basic PWA Service Worker with offline support + push notifications
const CACHE_VERSION = 'v1';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const PRECACHE = `precache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![PRECACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Handle incoming push notifications
self.addEventListener('push', function(event) {
  let data = {
    title: 'New Notification',
    message: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/'
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        title: pushData.title || 'New Notification',
        message: pushData.message || 'You have a new notification',
        icon: pushData.icon || '/favicon.ico',
        badge: pushData.badge || '/favicon.ico',
        url: pushData.action_url || '/'
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const options = {
    body: data.message,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: 'crm-notification',
    data: {
      url: data.url,
      notificationId: data.notification_id
    },
    requireInteraction: false,
    renotify: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();

  // Get the URL to navigate to
  const url = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // If no matching window, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification);
});

// Message handler for communication with app
self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Network handling for offline capability
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // let the request pass through
  }

  // For navigation requests (HTML), try network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const respClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, respClone));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match('/')))
    );
    return;
  }

  // For static assets (js/css/images), use cache-first with background update
  if (/[/.](?:css|js|woff2?|png|jpg|jpeg|gif|svg|webp)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Update cache in background
          event.waitUntil(
            fetch(request).then((response) => {
              const respClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, respClone));
            }).catch(() => {})
          );
          return cached;
        }
        return fetch(request).then((response) => {
          const respClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, respClone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const respClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, respClone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

