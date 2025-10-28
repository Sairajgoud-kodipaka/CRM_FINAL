'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Download,
  Mail,
  Phone
} from 'lucide-react';

interface SegmentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  segmentName: string | null;
  segmentData?: {
    name: string;
    description: string;
    customerCount: number;
    percentage: number;
    growth: number;
    tags: string[];
    category: string;
    lastUpdated: string;
  };
}

export default function SegmentDetailsModal({
  open,
  onClose,
  segmentName,
  segmentData
}: SegmentDetailsModalProps) {
  if (!segmentData) return null;

  const handleExportSegment = () => {
    // Create CSV for this specific segment
    const csvData = [
      ['Segment Name', 'Customer Count', 'Percentage', 'Growth %', 'Category', 'Tags', 'Last Updated'],
      [
        segmentData.name,
        segmentData.customerCount.toString(),
        segmentData.percentage.toFixed(1),
        segmentData.growth.toFixed(1),
        segmentData.category,
        segmentData.tags.join('; '),
        segmentData.lastUpdated
      ]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${segmentData.name.toLowerCase().replace(/\s+/g, '-')}-segment-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleEmailCampaign = () => {
    // TODO: Implement email campaign functionality

  };

  const handleWhatsAppCampaign = () => {
    // TODO: Implement WhatsApp campaign functionality

  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {segmentData.name} Segment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Segment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Segment Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{segmentData.customerCount.toLocaleString()}</div>
                  <div className="text-sm text-blue-700">Total Customers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{segmentData.percentage.toFixed(1)}%</div>
                  <div className="text-sm text-green-700">of Total Base</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">{segmentData.growth.toFixed(1)}%</div>
                  <div className="text-sm text-purple-700">Growth Rate</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{segmentData.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                <Badge variant="secondary" className="capitalize">
                  {segmentData.category}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {segmentData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleExportSegment}
                >
                  <Download className="w-4 h-4" />
                  Export Segment Data
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleEmailCampaign}
                >
                  <Mail className="w-4 h-4" />
                  Email Campaign
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleWhatsAppCampaign}
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer Data */}
          <Card>
            <CardHeader>
              <CardTitle>Customers in this Segment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600 mb-2">Customer data will be loaded here</div>
                <div className="text-sm text-gray-500">
                  This will show real customers from the {segmentData.name} segment
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
