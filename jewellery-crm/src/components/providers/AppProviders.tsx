'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { NotificationProvider } from '@/hooks/useNotifications';
import { PWAInstallPrompt } from '@/components/pwa/InstallPrompt';
import { useToast } from '@/hooks/use-toast';
import { NotificationManager } from '@/components/notifications';
import { ThemeProvider } from './ThemeProvider';
import { ModalProvider } from '@/contexts/ModalContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { toast } = useToast();
  // Register service worker for PWA in production
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // No-op: avoid runtime crash if registration fails
        });
    }
  }, []);

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
            {children}
            <NotificationManager />
            <PWAInstallPrompt />
          </NotificationProvider>
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
