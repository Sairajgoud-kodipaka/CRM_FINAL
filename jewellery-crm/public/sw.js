// Service Worker for Web Push Notifications
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
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

