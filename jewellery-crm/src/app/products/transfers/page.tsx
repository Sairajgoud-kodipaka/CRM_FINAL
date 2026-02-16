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

export default function TransfersRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const prefix = user?.role ? (ROLE_PREFIX[user.role] || 'sales') : 'sales';
    const path = prefix === 'business-admin' ? '/business-admin/inventory' : prefix === 'manager' ? '/manager/inventory' : `/${prefix}/products`;
    router.replace(path);
  }, [router, user?.role]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
      Redirecting…
    </div>
  );
}
