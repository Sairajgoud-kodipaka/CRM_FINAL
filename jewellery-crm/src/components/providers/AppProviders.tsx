'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { NotificationProvider } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from './ThemeProvider';
import { ModalProvider } from '@/contexts/ModalContext';
import { PushNotificationInitializer } from '@/components/push/PushNotificationInitializer';
import '@/utils/testPushNotifications'; // Make test function available in console

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { toast } = useToast();
  // Service worker registration is handled by next-pwa configuration

  // Global session expired listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      toast({
        title: 'Session expired',
        description: detail?.message || 'Please sign in again.',
        variant: 'warning'
      });
    };
    window.addEventListener('sessionExpired', handler as EventListener);
    return () => window.removeEventListener('sessionExpired', handler as EventListener);
  }, [toast]);

  // Online/offline indicator
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => toast({ title: 'Back online', variant: 'success' });
    const onOffline = () => toast({ title: 'You are offline', description: 'Actions will be queued', variant: 'warning' });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ModalProvider>
          <NotificationProvider>
            <PushNotificationInitializer />
            {children}
          </NotificationProvider>
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
