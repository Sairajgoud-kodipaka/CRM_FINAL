'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NewArticlePage() {
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Integrate with backend API
    setTimeout(() => setSubmitting(false), 1000);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Create New Article</h1>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label" htmlFor="title">Title</label>
            <input className="form-input" id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label className="form-label" htmlFor="content">Content</label>
            <textarea className="form-input" id="content" name="content" rows={8} value={form.content} onChange={handleChange} required />
          </div>
          <Button className="btn-primary mt-4" type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Article'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
 
 