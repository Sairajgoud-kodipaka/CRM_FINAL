'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export default function MarketingStoreBuilderPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Store Website Builder</h1>
        <p className="text-text-secondary mt-1">Create and customize your store's website and landing pages</p>
      </div>
      <Card className="p-6 flex flex-col items-center gap-4">
        <Wand2 className="w-12 h-12 text-blue-500 mb-2" />
        <div className="font-semibold text-text-primary">Drag-and-drop builder coming soon!</div>
        <div className="text-text-secondary">Easily design your store's website and landing pages with our intuitive builder.</div>
        <Button className="btn-primary mt-2">Launch Builder</Button>
      </Card>
    </div>
  );
}
