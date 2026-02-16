// Minimal service worker for Jewellery CRM
// - No precaching (avoids bad-precaching-response / 404 issues)
// - Handles Web Push notifications and notification click navigation

self.addEventListener('install', (event) => {
  // Activate this SW immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of open pages as soon as we're active
  event.waitUntil(self.clients.claim());
});

// Handle incoming push messages from the backend (pywebpush)
self.addEventListener('push', (event) => {
  let data = {};

  try {
    if (event.data) {
      // Prefer JSON payloads
      data = event.data.json();
    }
  } catch (err) {
    // Fallback: treat payload as plain text
    data = {
      title: 'Jewellery CRM',
      body: event.data ? event.data.text() : '',
    };
  }

  const title = data.title || 'Jewellery CRM';
  const options = {
    body: data.message || data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'jewellery-crm',
    renotify: !!data.renotify,
    data: {
      url: data.action_url || data.url || '/',
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When the user clicks a notification, focus an existing tab or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || notificationData.action_url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing client on the same origin
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow && targetUrl) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

