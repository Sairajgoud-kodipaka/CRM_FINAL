'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Eye } from 'lucide-react';

const tickets = [
  { id: 'TCK-101', subject: 'Customer complaint', status: 'open', priority: 'high', created: '7/30/2025' },
  { id: 'TCK-102', subject: 'Order delay', status: 'pending', priority: 'medium', created: '7/29/2025' },
  { id: 'TCK-103', subject: 'Payment issue', status: 'closed', priority: 'high', created: '7/28/2025' },
];

export default function ManagerSupportTicketsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Support Tickets</h1>
          <p className="text-text-secondary mt-1">View and manage support tickets</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button className="btn-primary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Ticket</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
      </div>
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input placeholder="Search by ticket ID or subject..." className="w-full md:w-80" />
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Ticket ID</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Subject</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Priority</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Created</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr key={i} className="border-t border-border hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-text-primary">{t.id}</td>
                  <td className="px-4 py-2 text-text-primary">{t.subject}</td>
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize text-xs">{t.status}</Badge></td>
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize text-xs">{t.priority}</Badge></td>
                  <td className="px-4 py-2 text-text-secondary">{t.created}</td>
                  <td className="px-4 py-2"><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}