'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';

const pages = [
  { name: 'Home', url: '/', status: 'published' },
  { name: 'About Us', url: '/about', status: 'published' },
  { name: 'Contact', url: '/contact', status: 'draft' },
];

export default function MarketingStorePagesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Store Pages</h1>
          <p className="text-text-secondary mt-1">Manage your store's website pages</p>
        </div>
        <Button className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Page</Button>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Page Name</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">URL</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{page.name}</td>
                  <td className="px-4 py-2 text-text-primary">{page.url}</td>
                  <td className="px-4 py-2"><span className="capitalize text-xs px-2 py-1 rounded bg-gray-100">{page.status}</span></td>
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
