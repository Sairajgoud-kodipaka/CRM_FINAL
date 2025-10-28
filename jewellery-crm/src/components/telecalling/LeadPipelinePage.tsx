'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Phone,
  Calendar,
  MessageCircle,
  Clock,
  User,
  PhoneOff,
  PhoneMissed,
  CheckCircle,
  XCircle,
  Trophy,
  Heart,
  Target,
  AlertCircle,
  FileText,
  MessageSquare,
  Volume1
} from 'lucide-react';
import { telecallingLegacyApiService, Assignment } from '@/services/telecallingLegacyApi';
import { PIPELINE_STATUSES, PIPELINE_LANES, NOTE_TEMPLATES, getStatusById, canTransitionTo, getNoteTemplatesForStatus } from '@/constants/pipeline';
import { StatusHoverNotes, PipelineStatusWithNotes } from './StatusHoverNotes';
import { AddNoteModal } from './AddNoteModal';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadPipelinePageProps {
  assignmentId: string;
}

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  newStatus: string;
  onConfirm: (note: string) => void;
}

interface NoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusId: string;
  statusLabel: string;
  notes: Array<{
    id: string;
    note: string;
    timestamp: string;
    status: string;
  }>;
}

interface CompleteNotesLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
}

function StatusUpdateModal({ isOpen, onClose, currentStatus, newStatus, onConfirm }: StatusUpdateModalProps) {
  const [note, setNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const currentStatusConfig = getStatusById(currentStatus);
  const newStatusConfig = getStatusById(newStatus);
  const noteTemplates = getNoteTemplatesForStatus(newStatus);

  const handleTemplateSelect = (template: string) => {
    setNote(template);
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (note.trim()) {
      onConfirm(note);
      setNote('');
      setSelectedTemplate('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${currentStatusConfig?.bgColor}`}>
              <span className={`text-sm font-medium ${currentStatusConfig?.textColor}`}>
                {currentStatusConfig?.label}
              </span>
            </div>
            <span className="text-gray-400">→</span>
            <div className={`p-2 rounded ${newStatusConfig?.bgColor}`}>
              <span className={`text-sm font-medium ${newStatusConfig?.textColor}`}>
                {newStatusConfig?.label}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {noteTemplates.slice(0, 6).map((template) => (
                <Button
                  key={template}
                  variant={selectedTemplate === template ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-xs"
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Add a note about this status change..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!note.trim()}
          >
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoteHistoryModal({ isOpen, onClose, statusId, statusLabel, notes }: NoteHistoryModalProps) {
  const statusConfig = getStatusById(statusId);

  const getStatusIcon = (statusId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'assigned': User,
      'in_progress': Phone,
      'completed': MessageCircle,
      'follow_up': Calendar,
      'unreachable': PhoneOff
    };

    const Icon = iconMap[statusId] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusConfig && getStatusIcon(statusId)}
            <span>Notes for {statusLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note, index) => (
                <div key={note.id || index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {note.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notes found for this stage</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteNotesLogModal({ isOpen, onClose, assignment }: CompleteNotesLogModalProps) {
  const getStatusIcon = (statusId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'assigned': User,
      'in_progress': Phone,
      'completed': MessageCircle,
      'follow_up': Calendar,
      'unreachable': PhoneOff
    };

    const Icon = iconMap[statusId] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusLabel = (statusId: string) => {
    const statusConfig = getStatusById(statusId);
    return statusConfig?.label || statusId;
  };

  const getStatusColor = (statusId: string) => {
    const statusConfig = getStatusById(statusId);
    return statusConfig?.bgColor || 'bg-gray-50';
  };

  const getAllNotes = () => {
    if (!assignment) return [];

    const notes = [];

    // Add assignment creation note
    notes.push({
      id: 'assignment-created',
      note: 'Lead assigned to telecaller',
      timestamp: assignment.created_at,
      status: 'assigned',
      type: 'system'
    });

    // Add current assignment notes
    if (assignment.notes) {
      notes.push({
        id: 'assignment-notes',
        note: assignment.notes,
        timestamp: assignment.updated_at,
        status: assignment.status,
        type: 'manual'
      });
    }

    // Add call logs as notes (if they exist)
    if ((assignment as any).call_logs) {
      (assignment as any).call_logs.forEach((callLog: any, index: number) => {
        notes.push({
          id: `call-log-${index}`,
          note: callLog.notes || 'Call made',
          timestamp: callLog.call_time,
          status: assignment.status,
          type: 'call',
          duration: callLog.duration
        });
      });
    }

    // Sort by timestamp (newest first)
    return notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const allNotes = getAllNotes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Complete Notes Log - {assignment?.customer_visit_details.customer_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {allNotes.length > 0 ? (
            <div className="space-y-3">
              {allNotes.map((note, index) => (
                 <div key={note.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(note.status)}
                      <Badge className={`${getStatusColor(note.status)} text-xs`}>
                        {getStatusLabel(note.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {note.type === 'system' ? 'System' : note.type === 'call' ? 'Call' : 'Manual'}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                  {(note as any).duration && (
                    <div className="text-xs text-gray-500">
                      Call Duration: {(note as any).duration} seconds
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notes found for this lead</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LeadPipelinePage({ assignmentId }: LeadPipelinePageProps) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    newStatus: string;
  }>({ isOpen: false, newStatus: '' });

  const [noteHistoryModal, setNoteHistoryModal] = useState<{
    isOpen: boolean;
    statusId: string;
    statusLabel: string;
    notes: Array<{
      id: string;
      note: string;
      timestamp: string;
      status: string;
    }>;
  }>({ isOpen: false, statusId: '', statusLabel: '', notes: [] });

  const [completeNotesLogModal, setCompleteNotesLogModal] = useState(false);
  const [addNoteModal, setAddNoteModal] = useState(false);

  // Map old status IDs to new ones for backward compatibility
  const mapOldStatusToNew = (oldStatus: string): string => {
    const statusMap: Record<string, string> = {
      'assigned': 'new_uncontacted',
      'in_progress': 'attempted_contact',
      'completed': 'contacted_in_progress',
      'follow_up': 'follow_up_scheduled',
      'unreachable': 'not_interested'
    };
    return statusMap[oldStatus] || oldStatus;
  };

  const getCurrentStatus = (): string => {
    if (!assignment) return 'new_uncontacted';
    return mapOldStatusToNew(assignment.status);
  };

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const assignments = await telecallingLegacyApiService.getAssignments();
      const foundAssignment = assignments.find(a => a.id.toString() === assignmentId);

      if (foundAssignment) {
        setAssignment(foundAssignment);
      } else {
        setError('Assignment not found');
      }
    } catch (err) {

      setError('Failed to fetch assignment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const handleStatusClick = (statusId: string) => {
    if (!assignment) return;

    const statusConfig = getStatusById(statusId);
    if (!statusConfig) return;

    const currentStatus = getCurrentStatus();
    const isCurrentStatus = currentStatus === statusId;
    const canTransition = canTransitionTo(currentStatus, statusId);

    if (isCurrentStatus) {
      // For current status, open add note modal directly
      setAddNoteModal(true);
    } else if (canTransition) {
      // Allow status transition
      setStatusUpdateModal({ isOpen: true, newStatus: statusId });
    } else {
      // Show note history for completed/past statuses
      showNoteHistory(statusId, statusConfig.label);
    }
  };

  const showNoteHistory = (statusId: string, statusLabel: string) => {
    // For now, we'll show mock data. In a real implementation, this would fetch from the backend
    const mockNotes = [
      {
        id: '1',
        note: assignment?.notes || 'No specific notes for this stage',
        timestamp: assignment?.updated_at || new Date().toISOString(),
        status: statusId,
        created_by: 'Telecaller Name',
        call_duration: 120,
        call_outcome: 'No answer'
      }
    ];

    setNoteHistoryModal({
      isOpen: true,
      statusId,
      statusLabel,
      notes: mockNotes
    });
  };

  // Mock status history data for hover notes
  const getMockStatusHistory = () => {
    if (!assignment) return [];

    return [
      {
        id: '1',
        note: 'Lead assigned to telecaller',
        timestamp: assignment.created_at,
        status: 'new_uncontacted',
        created_by: 'Manager',
        call_duration: undefined,
        call_outcome: undefined
      },
      {
        id: '2',
        note: assignment.notes || 'Initial contact attempt made',
        timestamp: assignment.updated_at,
        status: assignment.status,
        created_by: 'Telecaller',
        call_duration: 180,
        call_outcome: 'Conversation'
      }
    ];
  };

  const handleStatusConfirm = async (note: string) => {
    if (!assignment) return;

    try {
      // Update assignment status (this would be an API call in real implementation)


      // For now, just update local state
      setAssignment(prev => prev ? {
        ...prev,
        status: statusUpdateModal.newStatus as any,
        notes: note
      } : null);

      setStatusUpdateModal({ isOpen: false, newStatus: '' });
    } catch (err) {

    }
  };

  const handleAddNote = async (note: string, callDuration?: number, callOutcome?: string) => {
    if (!assignment) return;

    try {
      // Add note to current status (this would be an API call in real implementation)


      // For now, just update local state
      setAssignment(prev => prev ? {
        ...prev,
        notes: prev.notes ? `${prev.notes}\n\n${note}` : note,
        updated_at: new Date().toISOString()
      } : null);

      setAddNoteModal(false);
    } catch (err) {

    }
  };

  const getStatusIcon = (statusId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'assigned': User,
      'in_progress': Phone,
      'completed': MessageCircle,
      'follow_up': Calendar,
      'unreachable': PhoneOff
    };

    const Icon = iconMap[statusId] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-4 rounded-full" />
          <p className="text-text-secondary">Loading lead pipeline...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error || 'Assignment not found'}</p>
              <Button onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = assignment.customer_visit_details;
  const currentStatusConfig = getStatusById(assignment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
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

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-text-primary">
            {customer.customer_name}
          </h1>
          <p className="text-text-secondary">
            Lead Pipeline • {customer.customer_phone}
          </p>
        </div>

         <div className="flex gap-3">
           <Button
             variant="outline"
             onClick={() => setCompleteNotesLogModal(true)}
             className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 font-medium"
           >
             <FileText className="w-4 h-4" />
             All Notes
           </Button>
           <div className="flex gap-2">
        <Button
            onClick={() => {
                // Redirect to dedicated call page - use telecaller route if in telecaller context
                const isTelecallerContext = window.location.pathname.startsWith('/telecaller');
                const callRoute = isTelecallerContext ? '/telecaller/call' : '/telecalling/call';
                window.location.href = `${callRoute}?phone=${customer.customer_phone}&name=${customer.customer_name}&leadId=${customer.id}`;
            }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
        >
            <Phone className="w-4 h-4" />
            Call Now
        </Button>

             <Button
               variant="outline"
               onClick={() => {
                 // Quick SMS functionality

               }}
               className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-medium"
             >
               <MessageSquare className="w-4 h-4" />
               SMS
             </Button>

             <Button
               variant="outline"
               onClick={() => {
                 // Quick voice message

               }}
               className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 font-medium"
             >
               <Volume1 className="w-4 h-4" />
               Voice
             </Button>
           </div>
         </div>
      </div>

      {/* Lead Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{customer.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{customer.customer_phone}</span>
                </div>
                {customer.customer_email && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{customer.customer_email}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Lead Details</h3>
              <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <Badge className={`${currentStatusConfig?.bgColor} ${currentStatusConfig?.textColor} text-sm px-3 py-1 font-medium`}>
                     {currentStatusConfig?.label}
                   </Badge>
                   <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300 font-medium">
                     LIVE STATUS
                   </Badge>
                 </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {assignment.priority.toUpperCase()} Priority
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {customer.lead_quality.toUpperCase()} Lead
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-1">
                {customer.interests?.map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Kanban */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Click on any status to view notes or update the lead's pipeline stage
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PIPELINE_LANES.map((lane) => (
              <div key={lane.id} className="space-y-3">
                <h3 className="font-medium text-gray-900">{lane.title}</h3>
                <div className="space-y-2">
                  {lane.statuses.map((statusId) => {
                    const statusConfig = getStatusById(statusId);
                    if (!statusConfig) return null;

                    const currentStatus = getCurrentStatus();
                    const isCurrentStatus = currentStatus === statusId;
                    const canTransition = canTransitionTo(currentStatus, statusId);
                    const statusHistory = getMockStatusHistory();

                    return (
                      <PipelineStatusWithNotes
                        key={statusId}
                        statusId={statusId}
                        notes={statusHistory}
                        isActive={isCurrentStatus}
                        currentStatus={currentStatus}
                        onAddNote={() => setAddNoteModal(true)}
                        onViewNotes={() => showNoteHistory(statusId, statusConfig.label)}
                        onClick={() => handleStatusClick(statusId)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Assignment Created */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Lead Assigned</span>
                  <Badge variant="outline" className="text-xs">
                    {getCurrentStatus()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(assignment.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Lead assigned to telecaller
                </p>
              </div>
            </div>

            {/* Notes */}
            {assignment.notes && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Note Added</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(assignment.updated_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {assignment.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Add Note Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddNoteModal(true)}
                  className="w-full justify-start"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Note to Current Stage
                </Button>
              </div>
            </div>

            {/* Call Logs */}
            {(assignment as any).call_logs?.map((callLog: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Call Made</span>
                    <Badge variant="outline" className="text-xs">
                      {callLog.duration}s
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(callLog.call_time).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {callLog.notes || 'No notes recorded'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={statusUpdateModal.isOpen}
        onClose={() => setStatusUpdateModal({ isOpen: false, newStatus: '' })}
        currentStatus={getCurrentStatus()}
        newStatus={statusUpdateModal.newStatus}
        onConfirm={handleStatusConfirm}
      />

      {/* Note History Modal */}
      <NoteHistoryModal
        isOpen={noteHistoryModal.isOpen}
        onClose={() => setNoteHistoryModal({ isOpen: false, statusId: '', statusLabel: '', notes: [] })}
        statusId={noteHistoryModal.statusId}
        statusLabel={noteHistoryModal.statusLabel}
        notes={noteHistoryModal.notes}
      />

      {/* Complete Notes Log Modal */}
      <CompleteNotesLogModal
        isOpen={completeNotesLogModal}
        onClose={() => setCompleteNotesLogModal(false)}
        assignment={assignment}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={addNoteModal}
        onClose={() => setAddNoteModal(false)}
        currentStatus={getCurrentStatus()}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
