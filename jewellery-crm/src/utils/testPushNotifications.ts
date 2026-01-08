/**
 * Test Push Notifications Utility
 * 
 * Run this in browser console to test push notifications:
 * 
 * 1. Check service worker registration
 * 2. Check push subscription
 * 3. Request permission
 * 4. Test notification display
 */

export async function testPushNotifications() {
  console.log('🧪 Testing Push Notifications...');
  console.log('='.repeat(60));

  // Test 1: Check if supported
  console.log('\n1. Checking Browser Support...');
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  console.log(isSupported ? '✅ Push notifications supported' : '❌ Push notifications NOT supported');

  if (!isSupported) {
    console.log('⚠️  Your browser does not support push notifications');
    return;
  }

  // Test 2: Check permission
  console.log('\n2. Checking Notification Permission...');
  const permission = Notification.permission;
  console.log(`Current permission: ${permission}`);
  
  if (permission === 'denied') {
    console.log('❌ Permission denied. Please enable in browser settings.');
    return;
  }

  // Test 3: Check service worker
  console.log('\n3. Checking Service Worker...');
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service Worker registered:', registration.scope);
      console.log('   Active:', registration.active?.state);
      console.log('   Waiting:', registration.waiting?.state);
    } else {
      console.log('❌ No service worker registered');
      console.log('   Try refreshing the page');
      return;
    }
  } catch (error) {
    console.error('❌ Error checking service worker:', error);
    return;
  }

  // Test 4: Check push subscription
  console.log('\n4. Checking Push Subscription...');
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('✅ Push subscription active');
        console.log('   Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        console.log('   Keys:', {
          p256dh: subscription.getKey('p256dh') ? 'Present' : 'Missing',
          auth: subscription.getKey('auth') ? 'Present' : 'Missing'
        });
      } else {
        console.log('⚠️  No push subscription found');
        console.log('   The app should subscribe automatically when you log in');
      }
    }
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
  }

  // Test 5: Request permission if needed
  if (permission === 'default') {
    console.log('\n5. Requesting Permission...');
    try {
      const newPermission = await Notification.requestPermission();
      console.log(`Permission result: ${newPermission}`);
      if (newPermission === 'granted') {
        console.log('✅ Permission granted!');
        console.log('   Attempting to subscribe to push notifications...');
        
        // Try to subscribe after permission is granted
        try {
          const { pushNotificationService } = await import('@/services/pushNotificationService');
          await pushNotificationService.subscribe();
          console.log('✅ Successfully subscribed to push notifications!');
        } catch (subError: any) {
          console.error('⚠️  Could not auto-subscribe:', subError.message);
          console.log('   You may need to refresh the page or log in again');
        }
      } else {
        console.log('❌ Permission denied');
        return;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return;
    }
  } else if (permission === 'granted') {
    // Permission already granted but no subscription - try to subscribe
    console.log('\n5. Permission already granted, checking subscription...');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          console.log('⚠️  Permission granted but no subscription found');
          console.log('   Attempting to subscribe now...');
          try {
            const { pushNotificationService } = await import('@/services/pushNotificationService');
            await pushNotificationService.subscribe();
            console.log('✅ Successfully subscribed to push notifications!');
          } catch (subError: any) {
            console.error('⚠️  Could not subscribe:', subError.message);
            console.log('   You may need to refresh the page');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    }
  }

  // Test 6: Show test notification
  if (Notification.permission === 'granted') {
    console.log('\n6. Showing Test Notification...');
    try {
      const notification = new Notification('🧪 Test Notification', {
        body: 'If you see this, browser notifications are working!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        console.log('✅ Notification clicked');
        notification.close();
        window.focus();
      };

      console.log('✅ Test notification shown');
      console.log('   Click on it to test navigation');
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. If all checks pass, push notifications are working');
  console.log('2. Send a test notification from backend');
  console.log('3. Check browser console for push events');
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testPushNotifications = testPushNotifications;
}

