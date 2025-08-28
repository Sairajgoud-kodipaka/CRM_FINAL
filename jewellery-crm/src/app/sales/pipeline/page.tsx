'use client';
import React from 'react';
import { PipelineStageStatsSales } from '@/components/dashboard/PipelineStageStatsSales';

export default function SalesPipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Sales Pipeline</h1>
        <p className="text-text-secondary mt-2">
          Track and manage your sales pipeline stages and customer progress
        </p>
      </div>
      
      <PipelineStageStatsSales />
    </div>
  );
}