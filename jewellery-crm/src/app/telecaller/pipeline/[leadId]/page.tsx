'use client';
import React from 'react';
import { LeadPipelinePage } from '@/components/telecalling/LeadPipelinePage';

interface PageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default function IndividualLeadPipelinePage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <LeadPipelinePage assignmentId={resolvedParams.leadId} />;
}
