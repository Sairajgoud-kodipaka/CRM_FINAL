import React from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';

export default function TelecallerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
