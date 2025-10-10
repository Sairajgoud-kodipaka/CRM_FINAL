'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default function IndividualLeadPipelinePage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  
  // Redirect to the proper lead view page since this is a Lead UUID, not an Assignment ID
  React.useEffect(() => {
    router.replace(`/telecaller/leads/${resolvedParams.leadId}`);
  }, [resolvedParams.leadId, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Skeleton className="h-8 w-8 mx-auto mb-4 rounded-full" />
        <p className="text-gray-600">Redirecting to lead details...</p>
      </div>
    </div>
  );
}
