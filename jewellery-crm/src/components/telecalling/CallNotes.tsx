// Simplified Call Notes Component
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock } from 'lucide-react';

interface CallNote {
  id: string;
  timestamp: string;
  content: string;
  disposition: string;
  followUp: boolean;
}

interface CallNotesProps {
  leadName: string;
  leadId: string;
  leadStatus: string;
  notes: CallNote[];
  newNote: string;
  disposition: string;
  followUpRequired: boolean;
  onNoteChange: (note: string) => void;
  onDispositionChange: (disposition: string) => void;
  onFollowUpChange: (followUp: boolean) => void;
  onAddNote: () => void;
  isLoading?: boolean;
}

export function CallNotes({
  leadName,
  leadId,
  leadStatus,
  notes,
  newNote,
  disposition,
  followUpRequired,
  onNoteChange,
  onDispositionChange,
  onFollowUpChange,
  onAddNote,
  isLoading = false
}: CallNotesProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card className="p-6 h-full">
      <div className="space-y-6">
        {/* Lead Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Lead Information</h3>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Name:</span> {leadName}</div>
            <div><span className="font-medium">ID:</span> {leadId}</div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status:</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                {leadStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Add New Note */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Add New Note</h4>

          <Textarea
            value={newNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Enter your notes here..."
            className="min-h-[100px]"
            disabled={isLoading}
          />

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Disposition
              </label>
              <Select value={disposition} onValueChange={onDispositionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not-interested">Not Interested</SelectItem>
                  <SelectItem value="callback">Callback Required</SelectItem>
                  <SelectItem value="no-answer">No Answer</SelectItem>
                  <SelectItem value="busy">Line Busy</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="follow-up"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => onFollowUpChange(checked as boolean)}
                />
                <label htmlFor="follow-up" className="text-sm font-medium text-gray-700">
                  Follow-up
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={onAddNote}
            disabled={isLoading || !newNote.trim()}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Notes History */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Notes History</h4>

          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No notes yet. Add your first note above.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(note.timestamp)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {note.disposition}
                      </Badge>
                      {note.followUp && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Follow-up
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

