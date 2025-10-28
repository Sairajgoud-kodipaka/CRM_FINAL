'use client';

import { apiService } from './api-service';

/**
 * Convert VAPID public key from base64 URL-safe to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to Web Push notifications
 */
export async function subscribeToWebPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get VAPID public key from backend
    const response = await apiService.getVapidPublicKey();
    
    if (!response.success || !response.data?.public_key) {
      console.error('Failed to get VAPID public key');
      return false;
    }

    const publicKey = response.data.public_key;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to backend
    const subscribeResponse = await apiService.subscribeToPushNotifications(subscription.toJSON());
    
    if (subscribeResponse.success) {
      console.log('Successfully subscribed to push notifications');
      return true;
    } else {
      console.error('Failed to subscribe to push notifications:', subscribeResponse.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return false;
  }
}

/**
 * Unsubscribe from Web Push notifications
 */
export async function unsubscribeFromWebPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No active subscription to unsubscribe');
      return true;
    }

    // Unsubscribe from backend
    const endpoint = subscription.endpoint;
    await apiService.unsubscribeFromPushNotifications(endpoint);

    // Unsubscribe from browser
    await subscription.unsubscribe();
    
    console.log('Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

