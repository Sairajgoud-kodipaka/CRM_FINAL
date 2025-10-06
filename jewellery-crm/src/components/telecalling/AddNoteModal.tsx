'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Clock, Phone, Calendar } from 'lucide-react';
import { getStatusById, getNoteTemplatesForStatus } from '@/constants/pipeline';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onAddNote: (note: string, callDuration?: number, callOutcome?: string) => void;
}

const getStatusIcon = (statusId: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'new_uncontacted': MessageCircle,
    'attempted_contact': Phone,
    'missed_call_outbound': Phone,
    'missed_call_inbound': Phone,
    'contacted_in_progress': MessageCircle,
    'follow_up_scheduled': Calendar,
    'interested_warm': MessageCircle,
    'qualified': MessageCircle,
    'not_interested': MessageCircle,
    'converted_closed_won': MessageCircle,
    'lost_closed_lost': MessageCircle
  };
  
  const Icon = iconMap[statusId] || MessageCircle;
  return <Icon className="w-4 h-4" />;
};

export function AddNoteModal({ isOpen, onClose, currentStatus, onAddNote }: AddNoteModalProps) {
  const [note, setNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [callOutcome, setCallOutcome] = useState('');

  const statusConfig = getStatusById(currentStatus);
  const noteTemplates = getNoteTemplatesForStatus(currentStatus);

  const handleTemplateSelect = (template: string) => {
    setNote(template);
    setSelectedTemplate(template);
  };

  const handleAddNote = () => {
    if (note.trim()) {
      const duration = callDuration ? parseInt(callDuration) : undefined;
      onAddNote(note, duration, callOutcome || undefined);
      setNote('');
      setSelectedTemplate('');
      setCallDuration('');
      setCallOutcome('');
    }
  };

  const handleClose = () => {
    setNote('');
    setSelectedTemplate('');
    setCallDuration('');
    setCallOutcome('');
    onClose();
  };

  if (!statusConfig) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-1 rounded ${statusConfig.bgColor}`}>
              {getStatusIcon(currentStatus)}
            </div>
            <span>Add Note to {statusConfig.label}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className={`p-3 rounded ${statusConfig.bgColor}`}>
            <p className={`text-sm ${statusConfig.textColor}`}>
              {statusConfig.description}
            </p>
          </div>

          {noteTemplates.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {noteTemplates.slice(0, 4).map((template) => (
                  <Button
                    key={template}
                    variant={selectedTemplate === template ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-xs justify-start"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Default quick templates for active stages if no specific templates */}
          {noteTemplates.length === 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['No answer', 'Busy', 'Interested in gold', 'Call back tomorrow'].map((template) => (
                  <Button
                    key={template}
                    variant={selectedTemplate === template ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-xs justify-start"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Note <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your note here..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Call-specific fields for relevant statuses */}
          {(currentStatus === 'attempted_contact' || 
            currentStatus === 'missed_call_outbound' || 
            currentStatus === 'missed_call_inbound' || 
            currentStatus === 'contacted_in_progress') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Call Duration (seconds)
                </label>
                <input
                  type="number"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  placeholder="e.g., 120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Call Outcome
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select outcome</option>
                  <option value="No answer">No answer</option>
                  <option value="Busy">Busy</option>
                  <option value="Answered">Answered</option>
                  <option value="Voicemail">Voicemail</option>
                  <option value="Wrong number">Wrong number</option>
                  <option value="Not interested">Not interested</option>
                  <option value="Interested">Interested</option>
                  <option value="Callback requested">Callback requested</option>
                </select>
              </div>
            </div>
          )}

          {/* Next action fields for follow-up statuses */}
          {(currentStatus === 'follow_up_scheduled' || 
            currentStatus === 'interested_warm' || 
            currentStatus === 'qualified') && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Next Action
              </label>
              <input
                type="text"
                placeholder="e.g., Call back tomorrow at 2 PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddNote}
            disabled={!note.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
