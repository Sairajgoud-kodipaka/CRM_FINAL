import React from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
