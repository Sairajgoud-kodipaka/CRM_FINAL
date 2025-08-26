'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const customers = [
  { name: 'Priya S.', segment: 'Wedding', email: 'priya@gmail.com', phone: '9000000001', status: 'active', last: '7/30/2025' },
  { name: 'Amit R.', segment: 'High Value', email: 'amit@gmail.com', phone: '9000000002', status: 'inactive', last: '7/29/2025' },
  { name: 'Sneha K.', segment: 'Returning', email: 'sneha@gmail.com', phone: '9000000003', status: 'active', last: '7/28/2025' },
];

export default function MarketingCustomersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
          <p className="text-text-secondary mt-1">View and segment your customer base</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm">Export CSV</Button>
          <Button variant="outline" size="sm">Export JSON</Button>
        </div>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input placeholder="Search by name, email, or phone..." className="w-full md:w-80" />
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="highvalue">High Value</SelectItem>
              <SelectItem value="returning">Returning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Segment</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Phone</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{c.name}</td>
                  <td className="px-4 py-2 text-text-primary">{c.segment}</td>
                  <td className="px-4 py-2 text-text-primary">{c.email}</td>
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