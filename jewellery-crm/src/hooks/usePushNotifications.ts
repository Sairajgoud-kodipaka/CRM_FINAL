import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
  });

  // Check initial state
  useEffect(() => {
    const checkState = async () => {
      const isSupported = pushNotificationService.isSupported();
      const permission = ('Notification' in window) 
        ? Notification.permission 
        : 'denied';
      
      let isSubscribed = false;
      if (isSupported) {
        const subscription = await pushNotificationService.getSubscription();
        isSubscribed = subscription !== null;
      }

      setState({
        isSupported,
        isSubscribed,
        permission,
        isLoading: false,
      });
    };

    checkState();
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Request permission if needed
      if (state.permission === 'default') {
        const permission = await pushNotificationService.requestPermission();
        setState(prev => ({ ...prev, permission }));

        if (permission !== 'granted') {
          toast({
            title: 'Permission Denied',
            description: 'Please allow notifications in your browser settings.',
            variant: 'destructive',
          });
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      }

      // Subscribe
      await pushNotificationService.subscribe();

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      toast({
        title: 'Push Notifications Enabled',
        description: 'You will now receive push notifications.',
        variant: 'default',
      });

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to enable push notifications.',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.permission, toast]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await pushNotificationService.unsubscribe();

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: 'Push Notifications Disabled',
        description: 'You will no longer receive push notifications.',
        variant: 'default',
      });

      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Unsubscription Failed',
        description: error.message || 'Failed to disable push notifications.',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [toast]);

  /**
   * Toggle push notifications
   */
  const toggle = useCallback(async () => {
    if (state.isSubscribed) {
      return await unsubscribe();
    } else {
      return await subscribe();
    }
  }, [state.isSubscribed, subscribe, unsubscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggle,
  };
}

