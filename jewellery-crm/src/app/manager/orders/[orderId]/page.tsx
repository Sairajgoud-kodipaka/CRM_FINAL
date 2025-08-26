'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

const order = {
  id: 'ORD-001',
  customer: 'Varun T.',
  status: 'completed',
  amount: '₹12,000',
  date: '7/30/2025',
  items: [
    { name: 'Gold Necklace', qty: 1, price: '₹10,000' },
    { name: 'Silver Ring', qty: 2, price: '₹1,000' },
  ],
};

export default function ManagerOrderDetailPage() {
  const { orderId } = useParams();
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Order Details</h1>
        <p className="text-text-secondary mt-1">Review and manage order</p>
      </div>
      <Card className="p-6 flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-text-primary">Order #{order.id}</div>
            <div className="text-sm text-text-muted">Customer: {order.customer}</div>
            <div className="text-sm text-text-muted">Date: {order.date}</div>
            <div className="text-sm text-text-muted">Amount: {order.amount}</div>
          </div>
          <Badge variant="outline" className="capitalize text-xs h-fit">{order.status}</Badge>
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-semibold mb-2">Order Items</div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.qty}</td>
                <td className="px-4 py-2">{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-4 flex flex-col gap-2">
        <div className="font-semibold mb-2">Order Actions</div>
        <div className="flex gap-2">
          <Button variant="outline">Approve</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-semibold mb-2">Activity Log</div>
        <div className="text-sm text-text-muted">No activity yet.</div>
      </Card>
    </div>
  );
}
