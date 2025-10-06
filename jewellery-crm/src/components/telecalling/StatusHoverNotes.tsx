'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
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
  Ban,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { getStatusById, getNoteTemplatesForStatus } from '@/constants/pipeline';

interface StatusNote {
  id: string;
  note: string;
  timestamp: string;
  status: string;
  created_by?: string;
  call_duration?: number;
  call_outcome?: string;
}

interface StatusHoverNotesProps {
  statusId: string;
  notes: StatusNote[];
  children: React.ReactNode;
  className?: string;
  currentStatus?: string;
  onAddNote?: () => void;
  onViewNotes?: () => void;
}

const getStatusIcon = (statusId: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'new_uncontacted': UserPlus,
    'attempted_contact': Phone,
    'missed_call_outbound': PhoneOff,
    'missed_call_inbound': PhoneMissed,
    'contacted_in_progress': MessageCircle,
    'follow_up_scheduled': Calendar,
    'interested_warm': Heart,
    'qualified': CheckCircle,
    'not_interested': XCircle,
    'converted_closed_won': Trophy,
    'lost_closed_lost': Ban
  };
  
  const Icon = iconMap[statusId] || Clock;
  return <Icon className="w-4 h-4" />;
};

export function StatusHoverNotes({ 
  statusId, 
  notes, 
  children, 
  className = '', 
  currentStatus,
  onAddNote,
  onViewNotes
}: StatusHoverNotesProps) {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = getStatusById(statusId);
  
  if (!statusConfig) return <>{children}</>;

  const isCurrentStatus = currentStatus === statusId;
  const statusNotes = notes.filter(note => note.status === statusId);
  
  // Determine if this is a future stage (higher priority than current)
  const currentPriority = getStatusById(currentStatus)?.priority || 0;
  const isFutureStage = statusConfig.priority > currentPriority;
  const isPastStage = statusConfig.priority < currentPriority;

  const handleClick = () => {
    if (isCurrentStatus && onAddNote) {
      onAddNote();
    } else if (isPastStage && onViewNotes) {
      onViewNotes();
    } else if (isFutureStage) {
      // Show warning that this is a future stage
      const currentStatusLabel = getStatusById(currentStatus || '')?.label || 'Unknown Status';
      alert(`This lead is currently at "${currentStatusLabel}". You cannot add notes to future stages.`);
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {children}
      
      {isHovered && (
        <div className="absolute z-50 top-full left-0 mt-2 w-80">
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1 rounded ${statusConfig.bgColor}`}>
                  {getStatusIcon(statusId)}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{statusConfig.label}</h4>
                  <p className="text-xs text-gray-500">{statusConfig.description}</p>
                </div>
              </div>
              
              {/* Different content based on stage relationship */}
              {isCurrentStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                      Current Stage
                    </Badge>
                    <span className="text-xs text-gray-500">Click to add/edit note</span>
                  </div>
                  
                  {statusNotes.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-600">Recent Notes:</p>
                      {statusNotes.slice(0, 3).map((note, index) => (
                        <div key={note.id || index} className="border-l-2 border-blue-200 pl-2">
                          <p className="text-sm text-gray-700">{note.note}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.timestamp).toLocaleDateString()} - {note.created_by}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notes yet</p>
                      <p className="text-xs">Click to add your first note</p>
                    </div>
                  )}
                </div>
              ) : isPastStage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Past Stage
                    </Badge>
                    <span className="text-xs text-gray-500">Click to view all notes</span>
                  </div>
                  
                  {statusNotes.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-600">Historical Notes:</p>
                      {statusNotes.slice(0, 3).map((note, index) => (
                        <div key={note.id || index} className="border-l-2 border-gray-200 pl-2">
                          <p className="text-sm text-gray-700">{note.note}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.timestamp).toLocaleDateString()} - {note.created_by}
                          </p>
                        </div>
                      ))}
                      {statusNotes.length > 3 && (
                        <p className="text-xs text-blue-600">+{statusNotes.length - 3} more notes</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notes recorded</p>
                    </div>
                  )}
                </div>
              ) : isFutureStage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                      Future Stage
                    </Badge>
                  </div>
                  
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm">This is a future stage</p>
                    <p className="text-xs">Lead is currently at "{getStatusById(currentStatus || '')?.label || 'Unknown Status'}"</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Component for displaying status with hover notes in pipeline view
export function PipelineStatusWithNotes({ 
  statusId, 
  notes, 
  isActive = false, 
  onClick,
  currentStatus,
  onAddNote,
  onViewNotes
}: { 
  statusId: string; 
  notes: StatusNote[]; 
  isActive?: boolean; 
  onClick?: () => void;
  currentStatus?: string;
  onAddNote?: () => void;
  onViewNotes?: () => void;
}) {
  const statusConfig = getStatusById(statusId);
  const statusNotes = notes.filter(note => note.status === statusId);

  if (!statusConfig) return null;

  return (
    <StatusHoverNotes 
      statusId={statusId} 
      notes={notes}
      currentStatus={currentStatus}
      onAddNote={onAddNote}
      onViewNotes={onViewNotes}
    >
      <div 
        className={`
          flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
          ${isActive ? `${statusConfig.bgColor} ${statusConfig.textColor} border-2 border-current` : 'bg-gray-50 hover:bg-gray-100'}
          ${statusNotes.length > 0 ? 'ring-1 ring-blue-200' : ''}
        `}
        onClick={onClick}
      >
        <div className={`p-1 rounded ${isActive ? 'bg-white/20' : statusConfig.bgColor}`}>
          {getStatusIcon(statusId)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${isActive ? 'text-white' : statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
            {statusNotes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {statusNotes.length} note{statusNotes.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
            {statusConfig.description}
          </p>
        </div>
      </div>
    </StatusHoverNotes>
  );
}

// Component for status badges with hover notes
export function StatusBadgeWithNotes({ 
  statusId, 
  notes, 
  className = '' 
}: { 
  statusId: string; 
  notes: StatusNote[]; 
  className?: string; 
}) {
  const statusConfig = getStatusById(statusId);
  const statusNotes = notes.filter(note => note.status === statusId);

  if (!statusConfig) return null;

  return (
    <StatusHoverNotes statusId={statusId} notes={notes}>
      <Badge 
        className={`${statusConfig.bgColor} ${statusConfig.textColor} ${className}`}
      >
        <div className="flex items-center gap-1">
          {getStatusIcon(statusId)}
          <span>{statusConfig.label}</span>
          {statusNotes.length > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({statusNotes.length})
            </span>
          )}
        </div>
      </Badge>
    </StatusHoverNotes>
  );
}
