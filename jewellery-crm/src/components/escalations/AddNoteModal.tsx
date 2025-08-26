'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService } from '@/lib/api-service';
import { MessageSquare, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AddNoteModalProps {
  escalationId: string;
  onSuccess?: () => void;
}

interface NoteFormData {
  content: string;
  is_internal: boolean;
}

export default function AddNoteModal({ escalationId, onSuccess }: AddNoteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NoteFormData>({
    content: '',
    is_internal: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.createEscalationNote(escalationId, {
        content: formData.content,
        is_internal: formData.is_internal,
      });

      if (response.success) {
        toast.success('Note added successfully!');
        setOpen(false);
        setFormData({
          content: '',
          is_internal: false,
        });
        onSuccess?.();
      } else {
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NoteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Add Note
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Note *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              required
            />
          </div>

          {/* Internal Note Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_internal"
              checked={formData.is_internal}
              onCheckedChange={(checked) => handleInputChange('is_internal', checked)}
            />
            <Label htmlFor="is_internal" className="flex items-center gap-2 text-sm">
              {formData.is_internal ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Internal note (not visible to customer)
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Public note (visible to customer)
                </>
              )}
            </Label>
          </div>

          {/* Note Type Indicator */}
          <div className={`p-3 rounded-lg text-sm ${
            formData.is_internal 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {formData.is_internal ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="font-medium">Internal Note</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">Public Note</span>
                </>
              )}
            </div>
            <p className="text-xs mt-1 opacity-75">
              {formData.is_internal 
                ? 'This note will only be visible to team members'
                : 'This note will be visible to the customer'
              }
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 