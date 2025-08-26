'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api-service';
import { Bell, Clock, AlertTriangle, CheckCircle, MessageSquare, Pin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AddAnnouncementModal from '@/components/announcements/AddAnnouncementModal';
import ReplyMessageModal from '@/components/announcements/ReplyMessageModal';
import AddMessageModal from '@/components/announcements/AddMessageModal';
import AnnouncementDetailModal from '@/components/announcements/AnnouncementDetailModal';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcement_type: string;
  priority: string;
  priority_color?: string;
  is_pinned: boolean;
  requires_acknowledgment: boolean;
  target_roles: string[];
  target_stores: Array<{ id: number; name: string; code: string }>;
  target_tenants: Array<{ id: number; name: string; slug: string }>;
  author: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    role: string;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
  created_at: string;
  updated_at: string;
  publish_at: string;
  expires_at?: string;
  is_active: boolean;
  is_read?: boolean;
  is_acknowledged?: boolean;
  is_read_by_current_user?: boolean;
  is_acknowledged_by_current_user?: boolean;
}

interface TeamMessage {
  id: number;
  subject: string;
  content: string;
  message_type: string;
  is_urgent: boolean;
  requires_response: boolean;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  created_at: string;
  is_read_by_current_user?: boolean;
  is_responded_by_current_user?: boolean;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'messages'>('announcements');
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  // Add debugging for user role
  console.log('AnnouncementsPage - User:', user);
  console.log('AnnouncementsPage - User role:', user?.role);
  console.log('AnnouncementsPage - Can create announcement:', user?.role === 'manager' || user?.role === 'inhouse_sales' || user?.role === 'business_admin');

  // Check if user can create announcements
  const canCreateAnnouncement = user?.role === 'manager' || user?.role === 'inhouse_sales' || user?.role === 'business_admin';

  useEffect(() => {
    fetchAnnouncements();
    fetchTeamMessages();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await apiService.getAnnouncements();
      console.log('Announcements response:', response);
      
      // Handle both response formats
      let announcementsData: any;
      
      if (response.success && response.data) {
        // Expected format: {success: true, data: [...]}
        announcementsData = response.data;
        console.log('Using response.data format');
      } else if (Array.isArray(response)) {
        // Direct format: [...] (current backend format)
        announcementsData = response;
        console.log('Using direct array format');
      } else if (response && Array.isArray(response)) {
        // Fallback: response is already an array
        announcementsData = response;
        console.log('Using fallback array format');
      } else {
        console.warn('Unexpected announcements response format:', response);
        setAnnouncements([]);
        return;
      }
      
      console.log('Announcements data:', announcementsData);
      console.log('Data type:', typeof announcementsData);
      console.log('Is array:', Array.isArray(announcementsData));
      
      if (Array.isArray(announcementsData)) {
        console.log('Setting announcements from array:', announcementsData.length, 'items');
        setAnnouncements(announcementsData);
      } else if (announcementsData && announcementsData.results && Array.isArray(announcementsData.results)) {
        console.log('Setting announcements from results:', announcementsData.results.length, 'items');
        setAnnouncements(announcementsData.results);
      } else {
        console.warn('Unexpected announcements data format:', announcementsData);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  const fetchTeamMessages = async () => {
    try {
      const response = await apiService.getTeamMessages();
      console.log('Team messages response:', response);
      
      // Handle both response formats
      let messagesData: any;
      
      if (response.success && response.data) {
        // Expected format: {success: true, data: [...]}
        messagesData = response.data;
        console.log('Using response.data format for messages');
      } else if (Array.isArray(response)) {
        // Direct format: [...] (current backend format)
        messagesData = response;
        console.log('Using direct array format for messages');
      } else if (response && Array.isArray(response)) {
        // Fallback: response is already an array
        messagesData = response;
        console.log('Using fallback array format for messages');
      } else {
        console.warn('Unexpected team messages response format:', response);
        setTeamMessages([]);
        return;
      }
      
      if (Array.isArray(messagesData)) {
        setTeamMessages(messagesData);
      } else if (messagesData && messagesData.results && Array.isArray(messagesData.results)) {
        setTeamMessages(messagesData.results);
      } else {
        console.warn('Unexpected team messages data format:', messagesData);
        setTeamMessages([]);
      }
    } catch (error) {
      console.error('Error fetching team messages:', error);
      setTeamMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnnouncements();
    fetchTeamMessages();
  };

  const markAsRead = async (announcementId: number) => {
    try {
      await apiService.markAnnouncementAsRead(announcementId);
      // Update local state
      setAnnouncements(prev => 
        prev.map(ann => 
          ann.id === announcementId 
            ? { ...ann, is_read: true }
            : ann
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
        prev.map(ann => 
          ann.id === announcementId 
            ? { ...ann, is_acknowledged: true }
            : ann
        )
      );
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
      // Update local state
      setTeamMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_read: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'task':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'customer':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredAnnouncements = () => {
    if (!Array.isArray(announcements)) {
      return [];
    }
    
    // Filter by publish date (announcements are already filtered by backend)
    let filtered = announcements;
    
    if (filter === 'unread') {
      filtered = filtered.filter(ann => !ann.is_read_by_current_user);
    } else if (filter === 'urgent') {
      filtered = filtered.filter(ann => ann.priority === 'urgent' || ann.priority === 'high');
    }
    
    return filtered.sort((a, b) => {
      // Pinned announcements first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 3;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 3;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const getFilteredMessages = () => {
    if (!Array.isArray(teamMessages)) {
      return [];
    }
    
    let filtered = teamMessages;
    
    if (filter === 'unread') {
      filtered = filtered.filter(msg => !msg.is_read_by_current_user);
    } else if (filter === 'urgent') {
      filtered = filtered.filter(msg => msg.is_urgent);
    }
    
    return filtered.sort((a, b) => {
      // Urgent messages first
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      
      // Then by creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const unreadAnnouncementsCount = Array.isArray(announcements) ? announcements.filter(ann => !ann.is_read_by_current_user).length : 0;
  const unreadMessagesCount = Array.isArray(teamMessages) ? teamMessages.filter(msg => !msg.is_read_by_current_user).length : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Announcements</h1>
            <p className="text-text-secondary mt-1">Stay updated with important information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Announcements</h1>
          <p className="text-text-secondary mt-1">Stay updated with important information</p>
          {user && (
            <p className="text-xs text-text-muted mt-2">
              User Role: {user.role} | Can Create: {canCreateAnnouncement ? 'Yes' : 'No'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCreateAnnouncement && (
            <>
              <AddAnnouncementModal onSuccess={handleRefresh} />
              <AddMessageModal onSuccess={handleRefresh} />
              <Button 
                onClick={() => {
                  console.log('Test button clicked');
                  console.log('User role:', user?.role);
                  console.log('Can create:', canCreateAnnouncement);
                }}
                variant="outline"
                size="sm"
              >
                Test Add
              </Button>
            </>
          )}
          {!canCreateAnnouncement && (
            <div className="text-sm text-red-500">
              Role: {user?.role} - Cannot create announcements
            </div>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount} unread
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {unreadMessagesCount} messages
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'announcements' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('announcements')}
          className="flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          Announcements
          {unreadAnnouncementsCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadAnnouncementsCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('messages')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Team Messages
          {unreadMessagesCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadMessagesCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        <Button
          variant={filter === 'urgent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('urgent')}
        >
          Urgent
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'announcements' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredAnnouncements().map((announcement) => (
            <Card 
              key={announcement.id} 
                             className={`transition-all duration-200 hover:shadow-lg ${
                 !announcement.is_read_by_current_user ? 'ring-2 ring-blue-200' : ''
               } ${announcement.is_pinned ? 'border-l-4 border-l-blue-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(announcement.priority)}
                    <div className="flex items-center gap-2">
                      {announcement.is_pinned && <Pin className="w-4 h-4 text-blue-500" />}
                      <h3 className="font-semibold text-text-primary line-clamp-2">
                        {announcement.title}
                      </h3>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>{announcement.author.first_name} {announcement.author.last_name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(announcement.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-text-secondary text-sm line-clamp-3 mb-4">
                  {announcement.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!announcement.is_read_by_current_user && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(announcement.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    {announcement.requires_acknowledgment && !announcement.is_acknowledged_by_current_user && (
                      <Button
                        size="sm"
                        onClick={() => acknowledgeAnnouncement(announcement.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AnnouncementDetailModal announcement={announcement} onSuccess={handleRefresh} />
                    {announcement.is_read_by_current_user && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {getFilteredMessages().map((message) => (
            <Card 
              key={message.id}
                             className={`transition-all duration-200 hover:shadow-lg ${
                 !message.is_read_by_current_user ? 'ring-2 ring-blue-200' : ''
               } ${message.is_urgent ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getMessageTypeIcon(message.message_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary">
                          {message.subject}
                        </h3>
                        {message.is_urgent && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                        {message.requires_response && (
                          <Badge variant="outline">Response Required</Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm mb-3">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>From: {message.sender.first_name} {message.sender.last_name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                                     <div className="flex items-center gap-2">
                     <ReplyMessageModal 
                       message={message} 
                       onSuccess={handleRefresh}
                     />
                     {!message.is_read_by_current_user && (
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => markMessageAsRead(message.id)}
                       >
                         Mark as Read
                       </Button>
                     )}
                     {message.is_responded_by_current_user && (
                       <CheckCircle className="w-4 h-4 text-green-500" />
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeTab === 'announcements' && getFilteredAnnouncements().length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Announcements</h3>
            <p className="text-text-secondary">You're all caught up! No new announcements at the moment.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'messages' && getFilteredMessages().length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Team Messages</h3>
            <p className="text-text-secondary">No team messages at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 