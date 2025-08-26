'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ManagerNewSupportTicketPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">New Support Ticket</h1>
        <p className="text-text-secondary mt-1">Describe your issue and our team will assist you</p>
      </div>
      <Card className="p-6 max-w-lg mx-auto">
        {submitted ? (
          <div className="text-green-600 font-semibold">Your ticket has been submitted!</div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} />
            </div>
            <Button type="submit" className="btn-primary mt-2">Submit Ticket</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
