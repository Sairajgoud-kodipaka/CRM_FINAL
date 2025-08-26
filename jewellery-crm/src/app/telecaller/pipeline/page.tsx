'use client';
import React from 'react';
import { Card } from '@/components/ui/card';

const stats = [
  { label: 'Total Leads', value: 20 },
  { label: 'Contacted', value: 12 },
  { label: 'Qualified', value: 8 },
  { label: 'Appointments Set', value: 5 },
];

const stages = [
  { label: 'Exhibition', count: 15 },
  { label: 'Social Media', count: 12 },
  { label: 'Interested', count: 8 },
];

export default function TelecallerPipelinePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Leads Pipeline</h1>
        <p className="text-text-secondary mt-1">Manage and qualify new leads</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{s.value}</div>
            <div className="text-sm text-text-secondary font-medium">{s.label}</div>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2 mt-4">Pipeline Stages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <Card key={stage.label} className="flex flex-col gap-1 p-4 items-start">
              <div className="font-semibold text-text-primary">{stage.label}</div>
              <div className="text-lg font-bold text-text-primary">{stage.count} leads</div>
            </Card>
          ))}
        </div>
      </div>
      <Card className="p-6 mt-4">
        <h3 className="text-base font-semibold mb-2 text-text-primary">Recent Leads</h3>
        <ul className="text-text-secondary text-sm space-y-1">
          <li>Priya S. - New</li>
          <li>Amit R. - Contacted</li>
          <li>Sneha K. - Qualified</li>
        </ul>
      </Card>
    </div>
  );
}