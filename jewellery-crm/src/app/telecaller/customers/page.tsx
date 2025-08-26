'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const customers = [
  { name: 'Priya S.', phone: '9000000001', status: 'exhibition', last: '7/30/2025' },
  { name: 'Amit R.', phone: '9000000002', status: 'social_media', last: '7/29/2025' },
  { name: 'Sneha K.', phone: '9000000003', status: 'exhibition', last: '7/28/2025' },
];

export default function TelecallerCustomersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
        <p className="text-text-secondary mt-1">Access customer contact lists</p>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input placeholder="Search by name or phone..." className="w-full md:w-80" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Phone</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Last Contacted</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{c.name}</td>
                  <td className="px-4 py-2 text-text-primary">{c.phone}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize text-xs">{c.status}</Badge></td>
                  <td className="px-4 py-2 text-text-secondary">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}