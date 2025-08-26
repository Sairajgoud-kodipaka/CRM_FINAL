'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const products = [
  { name: 'Gold Necklace', category: 'Gold', price: '₹10,000', status: 'active', updated: '7/30/2025' },
  { name: 'Diamond Ring', category: 'Diamond', price: '₹25,000', status: 'inactive', updated: '7/29/2025' },
  { name: 'Silver Anklet', category: 'Silver', price: '₹2,000', status: 'active', updated: '7/28/2025' },
];

export default function MarketingProductsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Product Catalog</h1>
        <p className="text-text-secondary mt-1">Review products for marketing content</p>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input placeholder="Search by product or category..." className="w-full md:w-80" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Product</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Category</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Price</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{p.name}</td>
                  <td className="px-4 py-2 text-text-primary">{p.category}</td>
                  <td className="px-4 py-2 text-text-primary">{p.price}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize text-xs">{p.status}</Badge></td>
                  <td className="px-4 py-2 text-text-secondary">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
