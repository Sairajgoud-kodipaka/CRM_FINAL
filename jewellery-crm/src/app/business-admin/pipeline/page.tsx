'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Target } from 'lucide-react';
import PipelineStageStats from '@/components/dashboard/PipelineStageStats';

export default function PipelinePage() {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Sales Pipeline</h1>
          <p className="text-text-secondary mt-1">Track and manage your sales opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stage Stats - Clickable Cards */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Pipeline Stage Overview
            <Badge variant="outline" className="ml-2">
              Click any stage to view customers
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStageStats />
        </CardContent>
      </Card>






    </div>
  );
}