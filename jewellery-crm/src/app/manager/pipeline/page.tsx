'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Target } from 'lucide-react';
import { PipelineStageStatsManager } from '@/components/dashboard/PipelineStageStatsManager';

export default function ManagerPipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">Sales Pipeline</h1>
        <p className="text-text-secondary mt-2">
          Track and manage your sales pipeline stages and customer progress
        </p>
      </div>
      
      <PipelineStageStatsManager />
    </div>
  );
}