'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

const promotions = [
  { name: 'Diwali Gold Fest', type: 'Discount', start: '2025-10-20', end: '2025-11-10', status: 'active' },
  { name: 'Wedding Offer', type: 'Bundle', start: '2025-12-01', end: '2025-12-31', status: 'upcoming' },
];

export default function MarketingStorePromotionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Store Promotions</h1>
          <p className="text-text-secondary mt-1">Create and manage discounts, coupons, and sales</p>
        </div>
        <Button className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Promotion</Button>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Promotion</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Type</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Start</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">End</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{promo.name}</td>
                  <td className="px-4 py-2 text-text-primary">{promo.type}</td>
                  <td className="px-4 py-2 text-text-primary">{promo.start}</td>
                  <td className="px-4 py-2 text-text-primary">{promo.end}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize text-xs">{promo.status}</Badge></td>
                  <td className="px-4 py-2 flex gap-2">
                    <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
