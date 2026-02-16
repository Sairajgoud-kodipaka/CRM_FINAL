'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const ROLE_PREFIX: Record<string, string> = {
  business_admin: 'business-admin',
  manager: 'manager',
  inhouse_sales: 'sales',
  tele_calling: 'telecaller',
  marketing: 'marketing',
  platform_admin: 'platform',
};

export default function CustomersRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const prefix = user?.role ? (ROLE_PREFIX[user.role] || 'sales') : 'sales';
    router.replace(`/${prefix}/customers`);
  }, [router, user?.role, isAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
      Redirecting to customers…
    </div>
  );
}
