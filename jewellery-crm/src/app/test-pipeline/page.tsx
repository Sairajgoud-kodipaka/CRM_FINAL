'use client';

import React from 'react';
import { PipelineStageStats } from '@/components/dashboard/PipelineStageStats';

export default function TestPipelinePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pipeline Stage Stats Test</h1>
      <p className="text-muted-foreground mb-6">
        This page tests the PipelineStageStats component to ensure it works correctly.
      </p>
      
      <PipelineStageStats />
    </div>
  );
}
