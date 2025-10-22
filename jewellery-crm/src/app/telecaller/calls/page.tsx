'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, AlertCircle, Plus, Search, Filter, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { telecallingApiService } from '@/services/telecallingApi';

interface CustomerName {
  id: string;
  name: string;
  phone?: string;
  source?: string;
}

interface CallLog {
  id: string;
  customer_name: string;
  customer_phone: string;
  call_time: string;
  call_duration: number;
  call_status: string;
  customer_sentiment: string;
  notes: string;
  telecaller: string;
}

interface CallSubmission {
  customer_name: string;
  customer_phone: string;
  call_duration: number;
  call_status: string;
  customer_sentiment: string;
  notes: string;
}

const CallSubmissionForm = ({ 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  onSubmit: (data: CallSubmission) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<CallSubmission>({
    customer_name: '',
    customer_phone: '',
    call_duration: 0,
    call_status: 'connected',
    customer_sentiment: 'neutral',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.customer_phone.trim()) {
      toast.error('Please fill in customer name and phone number');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Add Call Details</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div>
            <Label htmlFor="customer_phone">Phone Number *</Label>
            <Input
              id="customer_phone"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              placeholder="Enter phone number"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="call_duration">Duration (seconds)</Label>
            <Input
              id="call_duration"
              type="number"
              value={formData.call_duration}
              onChange={(e) => setFormData({ ...formData, call_duration: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="call_status">Call Status</Label>
            <Select value={formData.call_status} onValueChange={(value) => setFormData({ ...formData, call_status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="call_back">Call Back</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="customer_sentiment">Customer Sentiment</Label>
            <Select value={formData.customer_sentiment} onValueChange={(value) => setFormData({ ...formData, customer_sentiment: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add call notes..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Call'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const CallLogRow = ({ callLog }: { callLog: CallLog }) => {
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'connected': 'bg-green-100 text-green-800',
      'no_answer': 'bg-yellow-100 text-yellow-800',
      'busy': 'bg-orange-100 text-orange-800',
      'wrong_number': 'bg-red-100 text-red-800',
      'not_interested': 'bg-red-100 text-red-800',
      'call_back': 'bg-blue-100 text-blue-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string) => {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'negative': 'bg-red-100 text-red-800',
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4) + '****';
  };

  return (
    <tr className="border-t border-border hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{callLog.customer_name}</span>
          <span className="text-xs text-text-secondary">{formatPhone(callLog.customer_phone)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {new Date(callLog.call_time).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {formatDuration(callLog.call_duration)}
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${getStatusColor(callLog.call_status)}`}>
          {callLog.call_status.replace('_', ' ').toUpperCase()}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${getSentimentColor(callLog.customer_sentiment)}`}>
          {callLog.customer_sentiment.toUpperCase()}
        </Badge>
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm max-w-xs truncate">
        {callLog.notes || '-'}
      </td>
    </tr>
  );
};

const EmptyState = () => (
  <div className="text-center py-12">
    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
    <p className="text-gray-500 mb-4">
      You haven't logged any calls yet. Start by adding your call details.
    </p>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center py-12">
    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load call logs</h3>
    <p className="text-gray-500 mb-4">{error}</p>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

export default function TelecallerCallLogsPage() {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [customerNames, setCustomerNames] = useState<CustomerName[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const logs = await telecallingApiService.getCallLogs();
      setCallLogs(logs || []);
    } catch (err) {
      console.error('Error fetching call logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load call logs');
      setCallLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerNames = async () => {
    try {
      const names = await telecallingApiService.getCustomerNames();
      setCustomerNames(names || []);
    } catch (err) {
      console.error('Error fetching customer names:', err);
      // Don't show error for customer names as it's not critical
    }
  };

  useEffect(() => {
    fetchCallLogs();
    fetchCustomerNames();
  }, []);

  const handleSubmitCall = async (data: CallSubmission) => {
    try {
      setSubmitting(true);
      
      await telecallingApiService.submitCallLog(data);
      
      toast.success('Call logged successfully');
      setShowForm(false);
      fetchCallLogs(); // Refresh the list
    } catch (err) {
      console.error('Error submitting call:', err);
      toast.error('Failed to log call. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCallLogs = callLogs.filter(log => {
    const matchesSearch = log.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.customer_phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || log.call_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return <ErrorState error={error} onRetry={fetchCallLogs} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Call Logs</h1>
        <p className="text-text-secondary mt-1">Track and manage your call activities</p>
      </div>

      {/* Add Call Button */}
      <div className="flex justify TEMP_FIX: flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Call Details
        </Button>
      </div>

      {/* Call Submission Form */}
      {showForm && (
        <CallSubmissionForm
          onSubmit={handleSubmitCall}
          onCancel={() => setShowForm(false)}
          isLoading={submitting}
        />
      )}

      {/* Filters */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by name or phone..." 
                className="w-full md:w-80 pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="call_back">Call Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Filter className="w-4 h-4" />
            <span>{filteredCallLogs.length} calls</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        ) : filteredCallLogs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Call Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Sentiment</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCallLogs.map((callLog) => (
                  <CallLogRow
                    key={callLog.id}
                    callLog={callLog}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}