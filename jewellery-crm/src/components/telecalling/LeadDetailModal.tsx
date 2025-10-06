'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowRight,
  FileText,
  Target,
  Activity
} from 'lucide-react';
import { Lead } from '@/services/telecallingApi';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onCall: (lead: Lead) => void;
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const pipelineStages: PipelineStage[] = [
  {
    id: 'lead_generated',
    name: 'Lead Generated',
    status: 'completed',
    description: 'Lead created from Google Sheets',
    icon: FileText,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'assigned',
    name: 'Assigned',
    status: 'current',
    description: 'Lead assigned to telecaller',
    icon: User,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'contacted',
    name: 'Contacted',
    status: 'pending',
    description: 'Initial contact made',
    icon: Phone,
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    id: 'qualified',
    name: 'Qualified',
    status: 'pending',
    description: 'Lead qualified for sales',
    icon: Target,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'appointment_set',
    name: 'Appointment Set',
    status: 'pending',
    description: 'Appointment scheduled',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'converted',
    name: 'Converted',
    status: 'pending',
    description: 'Lead converted to customer',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800'
  }
];

export function LeadDetailModal({ lead, isOpen, onClose, onCall }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!lead) return null;
  
  // Determine pipeline status based on lead status
  const getPipelineStatus = (stageId: string): 'completed' | 'current' | 'pending' => {
    switch (lead.status) {
      case 'new':
        return stageId === 'lead_generated' ? 'completed' : 
               stageId === 'assigned' ? 'current' : 'pending';
      case 'contacted':
        return ['lead_generated', 'assigned'].includes(stageId) ? 'completed' : 
               stageId === 'contacted' ? 'current' : 'pending';
      case 'qualified':
        return ['lead_generated', 'assigned', 'contacted'].includes(stageId) ? 'completed' :
               stageId === 'qualified' ? 'current' : 'pending';
      case 'appointment_set':
        return ['lead_generated', 'assigned', 'contacted', 'qualified'].includes(stageId) ? 'completed' :
               stageId === 'appointment_set' ? 'current' : 'pending';
      case 'converted':
        return ['lead_generated', 'assigned', 'contacted', 'qualified', 'appointment_set'].includes(stageId) ? 'completed' :
               stageId === 'converted' ? 'current' : 'pending';
      case 'not_interested':
        return ['lead_generated', 'assigned'].includes(stageId) ? 'completed' :
               stageId === 'contacted' ? 'current' : 'pending';
      default:
        return stageId === 'lead_generated' ? 'completed' : 'pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'current':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'assigned': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'follow_up': 'bg-orange-100 text-orange-800',
      'unreachable': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-6 h-6" />
            Lead Details - {lead.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Lead Information</TabsTrigger>
            <TabsTrigger value="pipeline">Lead Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="font-medium">{lead.phone}</p>
                    </div>
                  </div>

                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{lead.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created Date</p>
                      <p className="font-medium">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityColor(lead.priority)}>
                    {lead.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {lead.source.toUpperCase()} SOURCE
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Google Sheets Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Google Sheets Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Source System</p>
                      <p className="font-medium">Google Sheets</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fetched At</p>
                      <p className="font-medium">
                        {new Date(assignment.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p className="font-medium">Telecaller #{assignment.telecaller}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assignment Date</p>
                      <p className="font-medium">
                        {new Date(assignment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Raw Google Sheets Data */}
                  {customer.raw_sheets_data && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-3">Original Spreadsheet Data</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(customer.raw_sheets_data).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {value ? String(value) : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {customer.interests && customer.interests.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {customer.interests.map((interest, index) => (
                          <Badge key={index} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">
                        {assignment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => onCall(assignment)}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Make Call
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Lead Pipeline Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipelineStages.map((stage, index) => {
                    const stageStatus = getPipelineStatus(stage.id);
                    const Icon = stage.icon;
                    
                    return (
                      <div key={stage.id} className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(stageStatus)}
                          <Icon className="w-5 h-5 text-gray-500" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{stage.name}</h3>
                            <Badge className={stage.color}>
                              {stageStatus.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{stage.description}</p>
                        </div>

                        {index < pipelineStages.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {pipelineStages.filter(s => getPipelineStatus(s.id) === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed Stages</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {pipelineStages.filter(s => getPipelineStatus(s.id) === 'current').length}
                    </p>
                    <p className="text-sm text-gray-600">Current Stage</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-600">
                      {pipelineStages.filter(s => getPipelineStatus(s.id) === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending Stages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => onCall(lead)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
