/**
 * Custom worker merged into next-pwa's generated SW.
 * Adds Web Push (push + notificationclick) so backend pywebpush can deliver notifications.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (err) {
    data = { title: 'Jewellery CRM', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Jewellery CRM';
  const options = {
    body: data.message || data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'jewellery-crm',
    renotify: !!data.renotify,
    data: { url: data.action_url || data.url || '/', ...data },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || notificationData.action_url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl) client.navigate(targetUrl);
            return;
          }
        }
        if (self.clients.openWindow && targetUrl) return self.clients.openWindow(targetUrl);
      })
  );
});
