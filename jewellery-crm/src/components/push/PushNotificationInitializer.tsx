'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

/**
 * PushNotificationInitializer Component
 * 
 * Automatically initializes push notifications when user is authenticated.
 * Registers service worker and subscribes to push notifications if permission is granted.
 */
export function PushNotificationInitializer() {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = pushNotificationService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      return;
    }

    // Only initialize when user is authenticated and hydrated
    if (!isAuthenticated || !isHydrated || !user || isInitialized) {
      return;
    }

    const initializePush = async () => {
      try {
        // Initialize push notifications (registers SW, subscribes if permission granted)
        const success = await pushNotificationService.initialize();
        
        if (success) {
          console.log('[Push] Push notifications initialized successfully');
        } else {
          // Permission not granted or not requested yet - this is fine
          console.log('[Push] Push notifications not active (permission not granted or VAPID not configured)');
        }
        
        setIsInitialized(true);
      } catch (error: any) {
        console.error('[Push] Failed to initialize push notifications:', error);
        // If it's a 404 error, the endpoint might not be configured - don't retry
        if (error?.message?.includes('VAPID endpoint not found') || error?.response?.status === 404) {
          console.warn('[Push] VAPID endpoint not available - push notifications disabled');
        }
        setIsInitialized(true); // Mark as initialized to prevent retry loops
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(initializePush, 1000);
    
    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isHydrated, isInitialized]);

  // Monitor permission changes and auto-subscribe (only if not already initialized)
  useEffect(() => {
    if (!isAuthenticated || !isHydrated || !user || !isSupported || !isInitialized) {
      return;
    }

    const checkPermissionAndSubscribe = async () => {
      if (Notification.permission === 'granted') {
        try {
          const subscription = await pushNotificationService.getSubscription();
          if (!subscription) {
            console.log('[Push] Permission granted, subscribing to push notifications...');
            try {
              await pushNotificationService.subscribe();
              console.log('[Push] Successfully subscribed');
            } catch (error: any) {
              // If VAPID endpoint not found, stop retrying
              if (error?.message?.includes('VAPID endpoint not found') || error?.response?.status === 404) {
                console.warn('[Push] VAPID endpoint not available, stopping retry');
                return;
              }
              throw error;
            }
          }
        } catch (error: any) {
          console.error('[Push] Error subscribing:', error);
          // Don't retry if it's a 404
          if (error?.response?.status === 404) {
            return;
          }
        }
      }
    };

    // Check once after a short delay (don't poll continuously)
    const timer = setTimeout(checkPermissionAndSubscribe, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [user, isAuthenticated, isHydrated, isSupported, isInitialized]);


  // Handle service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleServiceWorkerUpdate = () => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          // New service worker is waiting, prompt user to update
          console.log('[Push] New service worker available');
          // You can show a toast here to prompt user to refresh
        }
      });
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate);
    };
  }, []);

  return null; // This component doesn't render anything
}

