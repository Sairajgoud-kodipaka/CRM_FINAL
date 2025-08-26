'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Search, BarChart2 } from 'lucide-react';

const tools = [
  { name: 'SEO Optimizer', icon: Search },
  { name: 'Campaign Tracker', icon: BarChart2 },
  { name: 'Meta Tag Editor', icon: Settings },
];

export default function MarketingStoreMarketingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Marketing Tools & SEO</h1>
        <p className="text-text-secondary mt-1">Manage SEO settings and access marketing tools</p>
      </div>
      <Card className="p-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="font-semibold mb-2">SEO Settings (Mock)</div>
        <div className="text-text-secondary mb-4">Optimize your store's visibility in search engines.</div>
        <Button className="btn-primary w-fit mb-4">Edit SEO Settings</Button>
        <div className="font-semibold mb-2">Marketing Tools</div>
        <ul className="flex flex-col gap-3">
          {tools.map((tool, i) => (
            <li key={i} className="flex items-center gap-2">
              <tool.icon className="w-5 h-5 text-blue-500" />
              <span className="text-text-primary">{tool.name}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
