'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService } from '@/lib/api-service';
import { MessageSquare, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AddMessageModalProps {
  onSuccess?: () => void;
}

interface MessageFormData {
  subject: string;
  content: string;
  message_type: string;
  is_urgent: boolean;
  requires_response: boolean;
  recipients: string[];
}

export default function AddMessageModal({ onSuccess }: AddMessageModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MessageFormData>({
    subject: '',
    content: '',
    message_type: 'general',
    is_urgent: false,
    requires_response: false,
    recipients: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.createTeamMessage({
        ...formData,
      });

      if (response.success) {
        toast.success('Message sent successfully!');
        setOpen(false);
        setFormData({
          subject: '',
          content: '',
          message_type: 'general',
          is_urgent: false,
          requires_response: false,
          recipients: [],
        });
        onSuccess?.();
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MessageFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecipientChange = (recipient: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      recipients: checked 
        ? [...prev.recipients, recipient]
        : prev.recipients.filter(r => r !== recipient),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send New Team Message
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter message subject"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your message"
              rows={4}
              required
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Message Type</Label>
              <Select
                value={formData.message_type}
                onValueChange={(value) => handleInputChange('message_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="customer">Customer Related</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.is_urgent ? 'urgent' : 'normal'}
                onValueChange={(value) => handleInputChange('is_urgent', value === 'urgent')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'sales', label: 'Sales Team' },
                { value: 'inhouse_sales', label: 'In-House Sales' },
                { value: 'manager', label: 'Managers' },
                { value: 'admin', label: 'Administrators' },
              ].map((recipient) => (
                <div key={recipient.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={recipient.value}
                    checked={formData.recipients.includes(recipient.value)}
                    onCheckedChange={(checked) => handleRecipientChange(recipient.value, checked as boolean)}
                  />
                  <Label htmlFor={recipient.value} className="text-sm">
                    {recipient.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_response"
                checked={formData.requires_response}
                onCheckedChange={(checked) => handleInputChange('requires_response', checked)}
              />
              <Label htmlFor="requires_response">Requires response</Label>
            </div>
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
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 