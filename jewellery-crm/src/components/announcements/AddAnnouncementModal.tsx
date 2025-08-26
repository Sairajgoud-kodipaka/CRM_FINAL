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
import { Bell, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AddAnnouncementModalProps {
  onSuccess?: () => void;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  announcement_type: string;
  priority: string;
  is_pinned: boolean;
  requires_acknowledgment: boolean;
  target_roles: string[];
  publish_at: string;
  expires_at?: string;
}

export default function AddAnnouncementModal({ onSuccess }: AddAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    announcement_type: 'team_specific',
    priority: 'medium',
    is_pinned: false,
    requires_acknowledgment: false,
    target_roles: ['sales', 'inhouse_sales'],
    publish_at: new Date().toISOString().slice(0, 16),
    expires_at: '',
  });

  // Add debugging for user role
  const { user } = useAuth();
  
  console.log('AddAnnouncementModal - User:', user);
  console.log('AddAnnouncementModal - User role:', user?.role);
  console.log('AddAnnouncementModal - Can create announcement:', user?.role === 'manager' || user?.role === 'inhouse_sales' || user?.role === 'business_admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting announcement with data:', formData);
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Calling createAnnouncement API...');
      const response = await apiService.createAnnouncement({
        ...formData,
        expires_at: formData.expires_at || undefined,
      });

      console.log('Create announcement response:', response);

      if (response.success) {
        toast.success('Announcement created successfully!');
        setOpen(false);
        setFormData({
          title: '',
          content: '',
          announcement_type: 'team_specific',
          priority: 'medium',
          is_pinned: false,
          requires_acknowledgment: false,
          target_roles: ['sales', 'inhouse_sales'],
          publish_at: new Date().toISOString().slice(0, 16),
          expires_at: '',
        });
        onSuccess?.();
      } else {
        console.error('Failed to create announcement:', response);
        toast.error(response.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AnnouncementFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      target_roles: checked 
        ? [...prev.target_roles, role]
        : prev.target_roles.filter(r => r !== role),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Create New Announcement
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter announcement title"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter announcement content"
              rows={4}
              required
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.announcement_type}
                onValueChange={(value) => handleInputChange('announcement_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_specific">Team Specific</SelectItem>
                  <SelectItem value="store_specific">Store Specific</SelectItem>
                  <SelectItem value="system_wide">System Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Roles */}
          <div className="space-y-2">
            <Label>Target Roles</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'sales', label: 'Sales Team' },
                { value: 'inhouse_sales', label: 'In-House Sales' },
                { value: 'manager', label: 'Managers' },
                { value: 'admin', label: 'Administrators' },
              ].map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.target_roles.includes(role.value)}
                    onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                  />
                  <Label htmlFor={role.value} className="text-sm">
                    {role.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="publish_at">Publish Date</Label>
              <Input
                id="publish_at"
                type="datetime-local"
                value={formData.publish_at}
                onChange={(e) => handleInputChange('publish_at', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => handleInputChange('is_pinned', checked)}
              />
              <Label htmlFor="is_pinned">Pin this announcement</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_acknowledgment"
                checked={formData.requires_acknowledgment}
                onCheckedChange={(checked) => handleInputChange('requires_acknowledgment', checked)}
              />
              <Label htmlFor="requires_acknowledgment">Require acknowledgment</Label>
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
              {loading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 