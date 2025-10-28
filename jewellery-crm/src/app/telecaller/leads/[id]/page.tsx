'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Target,
  Activity,
  Database,
  ExternalLink,
  Copy,
  MessageSquare,
  Volume1,
  BarChart3,
  History,
  Tag,
  Globe
} from 'lucide-react';
import { telecallingApiService, Lead } from '@/services/telecallingApi';
import { useAuth } from '@/hooks/useAuth';
import { TransferToSalesModal } from '@/components/telecalling/TransferToSalesModal';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadDetail extends Lead {
  raw_data?: Record<string, any>;
  call_logs?: Array<{
    id: string;
    initiated_at: string;
    duration: number;
    status: string;
    notes: string;
    sentiment: string;
  }>;
  follow_ups?: Array<{
    id: string;
    due_at: string;
    priority: string;
    notes: string;
    status: string;
  }>;
}

export default function LeadViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const leadId = params.id as string;

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);



      // Fetch lead details with all Google Sheets data
      const leadData = await telecallingApiService.getLead(leadId);



      setLead(leadData);
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (lead) {
      router.push(`/telecaller/call?phone=${lead.phone}&name=${lead.name}&leadId=${lead.id}`);
    }
  };

  const handleTransferSuccess = () => {
    // Refresh lead data after successful transfer
    fetchLeadDetails();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800 border-blue-300',
      'contacted': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'qualified': 'bg-green-100 text-green-800 border-green-300',
      'appointment_set': 'bg-purple-100 text-purple-800 border-purple-300',
      'not_interested': 'bg-red-100 text-red-800 border-red-300',
      'converted': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      'high': 'bg-red-100 text-red-800 border-red-300',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'low': 'bg-green-100 text-green-800 border-green-300',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getSentimentColor = (sentiment: string) => {
    const colorMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-800 border-green-300',
      'neutral': 'bg-gray-100 text-gray-800 border-gray-300',
      'negative': 'bg-red-100 text-red-800 border-red-300',
    };
    return colorMap[sentiment] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-8 h-8 mx-auto mb-4 rounded-full" />
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Lead</h3>
          <p className="text-gray-600 mb-4">{error || 'Lead not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-sm text-gray-600">Lead Details & Google Sheets Data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(lead.status)}>
              {lead.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(lead.priority)}>
              {lead.priority.toUpperCase()} PRIORITY
            </Badge>
            <Button
              onClick={() => setTransferModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <ArrowRight className="w-4 h-4" />
              Transfer to Sales
            </Button>
            <Button
              onClick={handleCall}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets Data</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Customer Name</p>
                        <p className="font-medium">{lead.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead.phone}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(lead.phone)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {lead.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{lead.email}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(lead.email)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-medium">{lead.city || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Source</p>
                        <p className="font-medium">{lead.source.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Created Date</p>
                        <p className="font-medium">{formatDate(lead.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Last Interaction</p>
                        <p className="font-medium">
                          {lead.last_interaction ? formatDate(lead.last_interaction) : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Call Attempts</p>
                        <p className="font-medium">{lead.call_attempts}</p>
                      </div>
                    </div>

                    {lead.next_followup && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Next Follow-up</p>
                          <p className="font-medium">{formatDate(lead.next_followup)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags and Segments */}
                {(lead.tags?.length > 0 || lead.segments?.length > 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.tags?.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.segments?.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Segments</p>
                          <div className="flex flex-wrap gap-2">
                            {lead.segments.map((segment, index) => (
                              <Badge key={index} variant="outline">
                                {segment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{lead.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Information */}
            {lead.assigned_to_details && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Assignment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium">{lead.assigned_to_details.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assignment Date</p>
                      <p className="font-medium">
                        {lead.assigned_at ? formatDate(lead.assigned_at) : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            {/* Google Sheets Raw Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Google Sheets Raw Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.raw_data ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Source System Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Source System:</span>
                          <p className="text-blue-900">{lead.source_system}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Source ID:</span>
                          <p className="text-blue-900">{lead.source_id}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Fetched At:</span>
                          <p className="text-blue-900">{formatDate(lead.fetched_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Complete Spreadsheet Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(lead.raw_data).map(([key, value]) => (
                          <div key={key} className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {key.replace(/_/g, ' ')}
                              </span>
                              {typeof value === 'string' && value.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(String(value))}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-gray-900 break-words">
                              {value ? String(value) : (
                                <span className="text-gray-400 italic">No data</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No Google Sheets data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Call Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.call_logs && lead.call_logs.length > 0 ? (
                  <div className="space-y-4">
                    {lead.call_logs.map((call) => (
                      <div key={call.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{formatDate(call.initiated_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSentimentColor(call.sentiment)}>
                              {call.sentiment}
                            </Badge>
                            <Badge variant="outline">
                              {formatDuration(call.duration)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Status:</strong> {call.status}</p>
                          {call.notes && (
                            <p className="mt-1"><strong>Notes:</strong> {call.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No call history available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-ups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Follow-ups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.follow_ups && lead.follow_ups.length > 0 ? (
                  <div className="space-y-4">
                    {lead.follow_ups.map((followUp) => (
                      <div key={followUp.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{formatDate(followUp.due_at)}</span>
                          </div>
                          <Badge className={getPriorityColor(followUp.priority)}>
                            {followUp.priority} priority
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Status:</strong> {followUp.status}</p>
                          {followUp.notes && (
                            <p className="mt-1"><strong>Notes:</strong> {followUp.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No follow-ups scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Lead Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Lead Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Phone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{lead.call_attempts}</p>
                    <p className="text-sm text-gray-600">Call Attempts</p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {lead.follow_ups?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Follow-ups</p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {lead.call_logs?.reduce((total, call) => total + call.duration, 0) || 0}s
                    </p>
                    <p className="text-sm text-gray-600">Total Talk Time</p>
                  </div>

                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {lead.tags?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Tags</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Lead Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Lead Created</p>
                      <p className="text-sm text-gray-500">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>

                  {lead.assigned_at && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Lead Assigned</p>
                        <p className="text-sm text-gray-500">{formatDate(lead.assigned_at)}</p>
                      </div>
                    </div>
                  )}

                  {lead.last_interaction && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Last Interaction</p>
                        <p className="text-sm text-gray-500">{formatDate(lead.last_interaction)}</p>
                      </div>
                    </div>
                  )}

                  {lead.next_followup && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Next Follow-up</p>
                        <p className="text-sm text-gray-500">{formatDate(lead.next_followup)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Close
          </Button>
          <Button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <ArrowRight className="w-4 h-4" />
            Transfer to Sales
          </Button>
          <Button
            onClick={handleCall}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </Button>
        </div>
      </div>

      {/* Transfer Modal */}
      <TransferToSalesModal
        lead={lead}
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
}
