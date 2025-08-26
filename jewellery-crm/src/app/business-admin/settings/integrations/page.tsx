'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Zap, Mail, CreditCard, MessageCircle } from 'lucide-react';

const integrations = [
  { name: 'WhatsApp', icon: <MessageCircle className="w-5 h-5 text-green-500" />, status: 'connected', info: 'Send and receive WhatsApp messages.' },
  { name: 'Payment Gateway', icon: <CreditCard className="w-5 h-5 text-blue-500" />, status: 'disconnected', info: 'Accept online payments from customers.' },
  { name: 'Email', icon: <Mail className="w-5 h-5 text-orange-500" />, status: 'connected', info: 'Send order and appointment notifications.' },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Integrations</h1>
        <p className="text-text-secondary mt-1">Connect your CRM to third-party services</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, i) => (
          <Card key={i} className="flex flex-col gap-2 p-5">
            <div className="flex items-center gap-3">
              {integration.icon}
              <div className="font-semibold text-text-primary">{integration.name}</div>
              <Badge variant={integration.status === 'connected' ? 'default' : 'outline'} className={integration.status === 'connected' ? 'bg-green-600 text-white' : 'text-text-secondary'}>
                {integration.status === 'connected' ? <CheckCircle className="w-4 h-4 mr-1 inline" /> : <XCircle className="w-4 h-4 mr-1 inline" />}
                {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-text-secondary mb-2">{integration.info}</div>
            <div>
              {integration.status === 'connected' ? (
                <Button variant="outline" size="sm">Disconnect</Button>
              ) : (
                <Button className="btn-primary text-sm">Connect</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
 
 