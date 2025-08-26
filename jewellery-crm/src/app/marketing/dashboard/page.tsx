'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Percent, BarChart2, Plus } from 'lucide-react';

const stats = [
  { label: 'Campaigns', value: 8, icon: BarChart2, color: 'bg-blue-100 text-blue-600' },
  { label: 'Reach', value: '12,500', icon: Users, color: 'bg-purple-100 text-purple-600' },
  { label: 'Leads', value: 320, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { label: 'Conversion Rate', value: '4.2%', icon: Percent, color: 'bg-orange-100 text-orange-600' },
];

export default function MarketingDashboardPage() {
  return (
    <div className="flex flex-col gap-10 min-h-screen bg-gradient-to-b from-white to-slate-50 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2 mt-2">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Marketing Dashboard</h1>
          <p className="text-text-secondary mt-1 text-base">View high-level business and campaign metrics</p>
        </div>
        <Button className="btn-primary flex items-center gap-2 text-base font-semibold shadow-md"><Plus className="w-5 h-5" /> Create Campaign</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card
            key={s.label}
            className={`flex flex-row items-center gap-4 p-6 shadow-md transition-transform hover:scale-[1.03] border-0 ${s.color}`}
            style={{ minHeight: 110 }}
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-white/80 shadow ${s.color} text-2xl`}>
              <s.icon className={`w-8 h-8 ${s.color.split(' ')[1]}`} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-text-primary leading-tight">{s.value}</div>
              <div className="text-base text-text-secondary font-medium mt-1">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
        <Card className="p-8 shadow hover:shadow-lg transition-all">
          <div className="font-semibold text-lg mb-3 text-text-primary">Recent Campaigns</div>
          <ul className="text-base text-text-secondary space-y-1">
            <li>Email Blast - Diwali Sale</li>
            <li>Instagram Influencer Collab</li>
            <li>Google Ads - Bridal Collection</li>
          </ul>
        </Card>
        <Card className="p-8 shadow hover:shadow-lg transition-all">
          <div className="font-semibold text-lg mb-3 text-text-primary">Top Segments</div>
          <ul className="text-base text-text-secondary space-y-1">
            <li>Returning Customers</li>
            <li>High Value Purchasers</li>
            <li>Wedding Season Leads</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
