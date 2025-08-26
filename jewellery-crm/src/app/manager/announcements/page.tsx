'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Eye, Clock, AlertTriangle, CheckCircle, X, Users } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AnnouncementDetailModal from '@/components/announcements/AnnouncementDetailModal';

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  announcement_type: string;
  status: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  is_read_by_current_user: boolean;
  is_acknowledged_by_current_user: boolean;
  // Additional properties needed for AnnouncementDetailModal
  priority_color?: string;
  is_pinned: boolean;
  requires_acknowledgment: boolean;
  target_roles: string[];
  target_stores: Array<{ id: number; name: string; code: string }>;
  target_tenants: Array<{ id: number; name: string; slug: string }>;
  publish_at: string;
  expires_at?: string;
  updated_at: string;
  is_active: boolean;
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
}

interface NewAnnouncement {
  title: string;
  content: string;
  priority: string;
  type: string;
}

export default function ManagerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
    title: '',
    content: '',
    priority: 'medium',
    type: 'general'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // Fetch announcements filtered by current store members
      const response = await apiService.getAnnouncements();
      console.log('API Response:', response);
      if (response.success && response.data && Array.isArray(response.data)) {
        setAnnouncements(response.data);
        console.log('Announcements set:', response.data);
      } else {
        console.warn('Announcements response is not an array:', response.data);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      setCreating(true);
      // Create announcement with store-specific context
      const announcementData = {
        ...newAnnouncement,
        announcement_type: 'team_specific', // Ensure it's team-specific
        target_stores: [], // Will be set by backend based on user's store
      };
      
      const response = await apiService.createAnnouncement(announcementData);
      if (response.success) {
        // Reset form and close modal
        setNewAnnouncement({
          title: '',
          content: '',
          priority: 'medium',
          type: 'general'
        });
        setIsCreateModalOpen(false);
        // Refresh announcements
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setCreating(false);
    }
  };

  const markAsRead = async (announcementId: number) => {
    try {
      await apiService.markAnnouncementAsRead(announcementId);
             // Update local state
       setAnnouncements(prev => 
         prev.map(announcement => 
           announcement.id === announcementId 
             ? { ...announcement, is_read_by_current_user: true }
             : announcement
         )
       );
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const acknowledgeAnnouncement = async (announcementId: number) => {
    try {
      await apiService.acknowledgeAnnouncement(announcementId);
             // Update local state
       setAnnouncements(prev => 
         prev.map(announcement => 
           announcement.id === announcementId 
             ? { ...announcement, is_acknowledged_by_current_user: true }
             : announcement
         )
       );
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
    }
  };

  const filteredAnnouncements = Array.isArray(announcements) ? announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || announcement.announcement_type === typeFilter;
    
    return matchesSearch && matchesPriority && matchesType;
  }) : [];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Announcements</h1>
          <p className="text-text-secondary mt-1">View and manage team announcements</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Store Members Only
            </Badge>
            <span className="text-xs text-text-muted">Showing announcements from your store team</span>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter announcement content"
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newAnnouncement.priority} 
                    onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={newAnnouncement.type} 
                    onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createAnnouncement}
                  disabled={creating || !newAnnouncement.title || !newAnnouncement.content}
                >
                  {creating ? 'Creating...' : 'Create Announcement'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{Array.isArray(announcements) ? announcements.length : 0}</div>
          <div className="text-sm text-text-secondary font-medium">Total Announcements</div>
        </Card>
                 <Card className="flex flex-col gap-1 p-5">
           <div className="text-xl font-bold text-text-primary">
             {Array.isArray(announcements) ? announcements.filter(a => !a.is_read_by_current_user).length : 0}
           </div>
           <div className="text-sm text-text-secondary font-medium">Unread</div>
         </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">
            {Array.isArray(announcements) ? announcements.filter(a => a.priority === 'high').length : 0}
          </div>
          <div className="text-sm text-text-secondary font-medium">High Priority</div>
        </Card>
                 <Card className="flex flex-col gap-1 p-5">
           <div className="text-xl font-bold text-text-primary">
             {Array.isArray(announcements) ? announcements.filter(a => !a.is_acknowledged_by_current_user).length : 0}
           </div>
           <div className="text-sm text-text-secondary font-medium">Pending Acknowledgment</div>
         </Card>
      </div>

      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input 
            placeholder="Search announcements..." 
            className="w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
                                   <SelectContent>
                       <SelectItem value="all">All Types</SelectItem>
                       <SelectItem value="system_wide">System Wide</SelectItem>
                       <SelectItem value="store_specific">Store Specific</SelectItem>
                       <SelectItem value="team_specific">Team Specific</SelectItem>
                     </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No announcements found.
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
                             <Card key={announcement.id} className={`p-4 ${!announcement.is_read_by_current_user ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityIcon(announcement.priority)}
                      <h3 className="font-semibold text-text-primary">{announcement.title}</h3>
                      <Badge variant={getPriorityBadgeVariant(announcement.priority)} className="text-xs">
                        {announcement.priority}
                      </Badge>
                                             <Badge variant="outline" className="text-xs">
                         {announcement.announcement_type}
                       </Badge>
                    </div>
                    <p className="text-text-secondary text-sm mb-3">{announcement.content}</p>
                                         <div className="flex items-center gap-4 text-xs text-text-muted">
                       <span>By: {announcement.author?.first_name} {announcement.author?.last_name}</span>
                       <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                       {!announcement.is_read_by_current_user && (
                         <Badge variant="secondary" className="text-xs">Unread</Badge>
                       )}
                       {!announcement.is_acknowledged_by_current_user && (
                         <Badge variant="outline" className="text-xs">Pending Acknowledgment</Badge>
                       )}
                     </div>
                  </div>
                                     <div className="flex gap-2 ml-4">
                     {!announcement.is_read_by_current_user && (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => markAsRead(announcement.id)}
                       >
                         Mark as Read
                       </Button>
                     )}
                     {!announcement.is_acknowledged_by_current_user && (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => acknowledgeAnnouncement(announcement.id)}
                       >
                         Acknowledge
                       </Button>
                     )}
                     <AnnouncementDetailModal announcement={announcement} />
                   </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
} 