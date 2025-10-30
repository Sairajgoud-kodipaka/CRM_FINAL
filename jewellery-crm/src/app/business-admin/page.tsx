'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard
    router.replace('/business-admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-8 w-8 mx-auto mb-4 rounded-full" />
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
