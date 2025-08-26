'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Percent, Phone } from 'lucide-react';

const stats = [
  { label: 'Calls Made', value: 42, icon: Phone },
  { label: 'Appointments Set', value: 8, icon: Users },
  { label: 'Leads Qualified', value: 15, icon: TrendingUp },
  { label: 'Conversion Rate', value: '12%', icon: Percent },
];

export default function TelecallerDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Telecaller Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your personal performance (calls, appointments set)</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-row items-center gap-4 p-5">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mr-2">
              <s.icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-text-primary">{s.value}</div>
              <div className="text-sm text-text-secondary font-medium">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-semibold mb-2">Recent Activity</div>
          <ul className="text-sm text-text-secondary">
            <li>Called Priya S. (Lead)</li>
            <li>Set appointment for Amit R.</li>
            <li>Qualified Sneha K. as lead</li>
          </ul>
        </Card>
        <Card className="p-6">
          <div className="font-semibold mb-2">Top Leads</div>
          <ul className="text-sm text-text-secondary">
            <li>Priya S.</li>
            <li>Amit R.</li>
            <li>Sneha K.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}