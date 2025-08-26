'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, AlertCircle } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-semibold text-text-primary">Knowledge Base Articles</h1>
        <Link href="/platform/kb/new">
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>
      
      <Card className="p-8">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Knowledge Base Coming Soon</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The knowledge base feature is currently under development. This will allow platform administrators 
            to create and manage help articles for tenant businesses.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Backend API endpoints needed</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Planned Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Article Management</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create and edit help articles</li>
              <li>• Categorize articles by topic</li>
              <li>• Version control and history</li>
              <li>• Rich text editor support</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Search & Navigation</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full-text search functionality</li>
              <li>• Tag-based organization</li>
              <li>• Related articles suggestions</li>
              <li>• User-friendly navigation</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Analytics & Insights</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Article view statistics</li>
              <li>• Search query analytics</li>
              <li>• User feedback collection</li>
              <li>• Popular topics tracking</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Integration</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Support ticket integration</li>
              <li>• In-app help system</li>
              <li>• Email template linking</li>
              <li>• Multi-tenant support</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
 