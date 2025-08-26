'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

const customer = {
  name: 'Priya S.',
  phone: '9000000001',
  status: 'exhibition',
};

export default function TelecallerCustomerDetailPage() {
  const { customerId } = useParams();
  const [log, setLog] = useState('');
  const [logs, setLogs] = useState([
    { text: 'Called customer, no answer.', date: '7/30/2025' },
    { text: 'Left voicemail.', date: '7/29/2025' },
  ]);
  const handleLog = () => {
    if (log.trim()) {
      setLogs([{ text: log, date: new Date().toLocaleDateString() }, ...logs]);
      setLog('');
    }
  };
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Customer Details</h1>
        <p className="text-text-secondary mt-1">View contact info and log communication</p>
      </div>
      <Card className="p-6 flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-text-primary">{customer.name}</div>
            <div className="text-sm text-text-muted">{customer.phone}</div>
          </div>
          <Badge variant="outline" className="capitalize text-xs h-fit">{customer.status}</Badge>
        </div>
      </Card>
      <Card className="p-4 flex flex-col gap-4">
        <div className="font-semibold mb-2">Log Communication</div>
        <Textarea value={log} onChange={e => setLog(e.target.value)} placeholder="Type call notes or communication..." rows={3} />
        <Button className="btn-primary w-fit" onClick={handleLog}>Add Log</Button>
        <div className="mt-4">
          <div className="font-semibold mb-2">Previous Logs</div>
          <ul className="space-y-2">
            {logs.map((l, i) => (
              <li key={i} className="text-sm text-text-secondary border-b pb-1">
                <span className="font-medium text-text-primary">{l.date}:</span> {l.text}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
