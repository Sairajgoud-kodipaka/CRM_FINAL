'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/lib/api-service';
import { MessageSquare, Reply, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ReplyMessageModalProps {
  message: {
    id: number;
    subject: string;
    content: string;
    sender: {
      first_name: string;
      last_name: string;
    };
  };
  onSuccess?: () => void;
}

interface ReplyFormData {
  content: string;
  message_type: string;
  is_internal: boolean;
}

export default function ReplyMessageModal({ message, onSuccess }: ReplyMessageModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ReplyFormData>({
    content: '',
    message_type: 'reply',
    is_internal: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.replyToMessage(message.id, {
        content: formData.content,
        message_type: formData.message_type,
        is_internal: formData.is_internal,
      });

      if (response.success) {
        toast.success('Reply sent successfully!');
        setOpen(false);
        setFormData({
          content: '',
          message_type: 'reply',
          is_internal: false,
        });
        onSuccess?.();
      } else {
        toast.error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReplyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Reply className="w-4 h-4" />
          Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reply to Message
          </DialogTitle>
        </DialogHeader>
        
        {/* Original Message */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="text-sm text-gray-600 mb-2">
            From: {message.sender.first_name} {message.sender.last_name}
          </div>
          <div className="font-semibold text-sm mb-2">{message.subject}</div>
          <div className="text-sm text-gray-700">{message.content}</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reply Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Reply *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your reply..."
              rows={4}
              required
            />
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label htmlFor="message_type">Message Type</Label>
            <Select
              value={formData.message_type}
              onValueChange={(value) => handleInputChange('message_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reply">Reply</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="clarification">Clarification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal Message */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_internal"
              checked={formData.is_internal}
              onChange={(e) => handleInputChange('is_internal', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_internal" className="text-sm">
              Internal message (not visible to customer)
            </Label>
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
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 