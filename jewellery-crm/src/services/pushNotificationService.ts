/**
 * Push Notification Service
 * Handles Web Push API registration and subscription management
 */

import { apiService } from '@/lib/api-service';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if user has granted notification permission
   */
  async hasPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Get VAPID public key from backend
   */
  async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) {
      return this.vapidPublicKey;
    }

    try {
      const response = await apiService.getVapidPublicKey();

      if (response.success && response.data?.public_key) {
        this.vapidPublicKey = response.data.public_key;
        return this.vapidPublicKey;
      }

      throw new Error('VAPID public key not available');
    } catch (error: any) {
      console.error('[Push Service] Error fetching VAPID public key:', error);
      // Don't retry on 404 - endpoint might not be configured
      if (error?.response?.status === 404) {
        throw new Error('VAPID endpoint not found. Please check backend configuration.');
      }
      throw error;
    }
  }

  /**
   * Convert VAPID key (base64url) to Uint8Array. Handles invalid/empty keys safely.
   */
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('VAPID public key is missing or invalid (empty). Configure VAPID keys on the server.');
    }
    const trimmed = base64String.trim().replace(/\s/g, '').replace(/>/g, '');
    if (!trimmed) {
      throw new Error('VAPID public key is empty. Configure VAPID keys on the server.');
    }
    const padding = '='.repeat((4 - (trimmed.length % 4)) % 4);
    const base64 = (trimmed + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    try {
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (e) {
      throw new Error(
        'VAPID public key from server is not valid base64url. Check backend VAPID key configuration.'
      );
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[Push Service] Service Worker registered:', registration);
      this.registration = registration;

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('[Push Service] Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData> {
    try {
      // Check support
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported');
      }

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      if (!this.registration) {
        throw new Error('Service Worker registration failed');
      }

      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push (cast: DOM BufferSource expects ArrayBuffer; TS types use ArrayBufferLike)
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Extract subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(
            this.subscription.getKey('p256dh')!
          ),
          auth: this.arrayBufferToBase64(
            this.subscription.getKey('auth')!
          ),
        },
      };

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscriptionData);

      console.log('[Push Service] Subscribed to push notifications');
      return subscriptionData;
    } catch (error) {
      console.error('[Push Service] Subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    try {
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      if (!this.registration) {
        return;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Notify backend
        if (subscription.endpoint) {
          await apiService.unsubscribeFromPushNotifications(subscription.endpoint);
        }

        this.subscription = null;
        console.log('[Push Service] Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('[Push Service] Unsubscription failed:', error);
      throw error;
    }
  }

  /**
   * Check current subscription status
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      if (!this.registration) {
        return null;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('[Push Service] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(
    subscription: PushSubscriptionData
  ): Promise<void> {
    try {
      const response = await apiService.subscribeToPushNotifications(subscription);

      if (!response.success) {
        throw new Error('Failed to save subscription to backend');
      }

      console.log('[Push Service] Subscription saved to backend');
    } catch (error) {
      console.error('[Push Service] Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Initialize push notifications (register SW and subscribe if permission granted)
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        console.log('[Push Service] Push notifications not supported');
        return false;
      }

      // Register service worker (always do this)
      await this.registerServiceWorker();

      // Check if already subscribed (browser has a subscription)
      const existingSubscription = await this.getSubscription();
      if (existingSubscription) {
        console.log('[Push Service] Already subscribed to push notifications');
        // Always sync subscription to backend so backend has it (e.g. after backend restart or if first POST failed)
        try {
          const subscriptionData: PushSubscriptionData = {
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: this.arrayBufferToBase64(existingSubscription.getKey('auth')!),
            },
          };
          await this.sendSubscriptionToBackend(subscriptionData);
        } catch (e) {
          console.warn('[Push Service] Failed to sync existing subscription to backend:', e);
        }
        return true;
      }

      // Check permission
      if (Notification.permission === 'granted') {
        await this.subscribe();
        return true;
      } else if (Notification.permission === 'default') {
        // Permission not requested yet, don't auto-subscribe
        console.log('[Push Service] Permission not requested yet');
        return false;
      } else {
        // Permission denied
        console.log('[Push Service] Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('[Push Service] Initialization failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

