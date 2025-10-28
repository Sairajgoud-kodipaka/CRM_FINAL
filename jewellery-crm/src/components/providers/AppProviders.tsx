'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { NotificationProvider } from '@/hooks/useNotifications';
import { NotificationManager } from '@/components/notifications';
import { ThemeProvider } from './ThemeProvider';
import { ModalProvider } from '@/contexts/ModalContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
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
          </NotificationProvider>
        </ModalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
