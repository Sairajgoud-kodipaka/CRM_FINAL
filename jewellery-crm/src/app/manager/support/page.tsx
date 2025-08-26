'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const faqs = [
  { q: 'How do I add a new customer?', a: 'Go to Customers > + Add Customer and fill in the details.' },
  { q: 'How do I create a new order?', a: 'Go to Orders > + New Order and select products for the customer.' },
  { q: 'How do I contact support?', a: 'Click the Contact Support button below or email support@crm.com.' },
];

export default function ManagerSupportPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Help Center</h1>
        <p className="text-text-secondary mt-1">Find answers to common questions or contact support</p>
      </div>
      <Card className="p-6 flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="font-semibold mb-2">Frequently Asked Questions</div>
        <ul className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <li key={i}>
              <div className="font-medium text-text-primary">Q: {faq.q}</div>
              <div className="text-text-secondary">A: {faq.a}</div>
            </li>
          ))}
        </ul>
        <Button className="btn-primary mt-4 w-fit self-center">Contact Support</Button>
      </Card>
    </div>
  );
}
