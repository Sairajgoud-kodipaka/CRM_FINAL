'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const ROLE_PREFIX: Record<string, string> = {
  business_admin: 'business-admin',
  manager: 'manager',
  inhouse_sales: 'sales',
  tele_calling: 'telecaller',
  marketing: 'marketing',
  platform_admin: 'platform',
};

export default function AppointmentDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  useEffect(() => {
    const prefix = user?.role ? (ROLE_PREFIX[user.role] || 'sales') : 'sales';
    router.replace(id ? `/${prefix}/appointments?open=${id}` : `/${prefix}/appointments`);
  }, [router, id, user?.role]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
      Redirecting to appointment…
    </div>
  );
}
