'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, AlertCircle, Play, Download, Filter, Search, Calendar } from 'lucide-react';
import { telecallingLegacyApiService, CallLog } from '@/services/telecallingLegacyApi';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

const CallLogRow = ({
  callLog,
  onPlayRecording
}: {
  callLog: CallLog;
  onPlayRecording: (url: string) => void;
}) => {
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

  const customer = callLog.assignment_details.customer_visit_details;

  return (
    <tr className="border-t border-border hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{customer.customer_name}</span>
          <span className="text-xs text-text-secondary">{telecallingLegacyApiService.maskPhone(customer.customer_phone)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {new Date(callLog.call_time).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {callLog.call_duration}s
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${getStatusColor(callLog.call_status)}`}>
          {telecallingLegacyApiService.formatCallStatus(callLog.call_status)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${getSentimentColor(callLog.customer_sentiment)}`}>
          {telecallingLegacyApiService.formatSentiment(callLog.customer_sentiment)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm">
        {callLog.feedback || '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {callLog.recording_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPlayRecording(callLog.recording_url!)}
              className="text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Play
            </Button>
          )}
          {callLog.revisit_required && (
            <Badge variant="outline" className="text-xs text-orange-600">
              Follow-up
            </Badge>
          )}
        </div>
      </td>
    </tr>
  );
};

const StatsCard = ({
  label,
  value,
  icon: Icon,
  isLoading
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
}) => (
  <Card className="flex flex-col gap-1 p-5">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-blue-600" />
      <div className="text-xl font-bold text-text-primary">
        {isLoading ? '...' : value}
      </div>
    </div>
    <div className="text-sm text-text-secondary font-medium">{label}</div>
  </Card>
);

const EmptyState = () => (
  <div className="text-center py-12">
    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
    <p className="text-gray-500 mb-4">
      You haven't made any calls yet. Start calling your assigned leads.
    </p>
    <Button onClick={() => window.location.href = '/telecaller/customers'}>
      View Assigned Leads
    </Button>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState('all');

  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const logs = await telecallingLegacyApiService.getCallLogs();


      // Ensure we have an array
      if (Array.isArray(logs)) {
        setCallLogs(logs);
      } else if (logs && Array.isArray(logs.results)) {
        // Handle paginated response
        setCallLogs(logs.results);
      } else {

        setCallLogs([]);
      }
    } catch (err) {


      // If it's a network error or backend is down, show empty state
      if (err instanceof Error && (err.message.includes('Network') || err.message.includes('fetch'))) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (err instanceof Error && err.message.includes('403')) {
        setError('You do not have permission to view call logs. Please contact your manager.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load call logs');
      }

      setCallLogs([]); // Ensure callLogs is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const handlePlayRecording = (url: string) => {
    // Open recording in new tab or implement audio player
    window.open(url, '_blank');
  };

  const filteredCallLogs = (Array.isArray(callLogs) ? callLogs : []).filter(log => {
    // Add safety checks for nested properties
    if (!log || !log.assignment_details || !log.assignment_details.customer_visit_details) {

      return false;
    }

    const customer = log.assignment_details.customer_visit_details;
    const matchesSearch = customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         telecallingLegacyApiService.maskPhone(customer.customer_phone || '').includes(searchTerm);
    const matchesDisposition = dispositionFilter === 'all' || log.call_status === dispositionFilter;

    return matchesSearch && matchesDisposition;
  });

  if (error) {
    return <ErrorState error={error} onRetry={fetchCallLogs} />;
  }

  // Debug info (remove in production)


  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Call Logs</h1>
        <p className="text-text-secondary mt-1">View your call history and performance</p>
      </div>

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
              <Select value={dispositionFilter} onValueChange={setDispositionFilter}>
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
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Lead</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Call Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Sentiment</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCallLogs.map((callLog) => (
                  <CallLogRow
                    key={callLog.id}
                    callLog={callLog}
                    onPlayRecording={handlePlayRecording}
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
