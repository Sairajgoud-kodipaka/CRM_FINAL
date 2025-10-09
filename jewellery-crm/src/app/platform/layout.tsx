'use client';

import React from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole="platform_admin">
      <AppLayout>
        {children}
      </AppLayout>
    </AuthWrapper>
  );
}
