'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Clock, 
  User, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Tag,
  Phone,
  Calendar,
  Settings,
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';

interface SupportTicket {
  id: number;
  ticket_id: string;
  title: string;
  summary: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  created_by: number;
  tenant: number;
  assigned_to?: number;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  is_urgent: boolean;
  requires_callback: boolean;
  callback_phone?: string;
  callback_preferred_time?: string;
}

interface TicketMessage {
  id: number;
  ticket: number;
  sender: number;
  content: string;
  is_internal: boolean;
  is_system_message: boolean;
  message_type: string;
  created_at: string;
  updated_at: string;
}

export default function PlatformSupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const ticketId = params.ticketId as string;
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ticketResponse, messagesResponse] = await Promise.all([
        apiService.getSupportTicket(ticketId),
        apiService.getTicketMessages(ticketId)
      ]);
      
      console.log('Ticket Response:', ticketResponse);
      console.log('Messages Response:', messagesResponse);
      
      if (ticketResponse.success && ticketResponse.data) {
        setTicket(ticketResponse.data);
      } else {
        setError('Failed to load ticket details');
        return;
      }
      
      // Ensure messages is always an array
      if (messagesResponse.success && messagesResponse.data) {
        const messagesData = Array.isArray(messagesResponse.data) ? messagesResponse.data : (messagesResponse.data as any).results || [];
        console.log('Messages data:', messagesData);
        setMessages(messagesData);
      } else {
        console.log('No messages data, setting empty array');
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      await apiService.createTicketMessage(ticketId, {
        content: newMessage,
        is_internal: false,
        message_type: 'text'
      });
      
      setNewMessage('');
      // Refresh messages
      const messagesResponse = await apiService.getTicketMessages(ticketId);
      if (messagesResponse.success && messagesResponse.data) {
        const messagesData = Array.isArray(messagesResponse.data) ? messagesResponse.data : (messagesResponse.data as any).results || [];
        setMessages(messagesData);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (newStatus: string) => {
    try {
      await apiService.updateSupportTicket(ticketId, { status: newStatus });
      await fetchTicketDetails(); // Refresh ticket data
      setStatusUpdate('');
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      setError('Failed to update ticket status');
    }
  };

  const assignToMe = async () => {
    try {
      await apiService.assignTicketToMe(ticketId);
      await fetchTicketDetails(); // Refresh ticket data
    } catch (err) {
      console.error('Failed to assign ticket:', err);
      setError('Failed to assign ticket');
    }
  };

  const resolveTicket = async () => {
    try {
      await apiService.resolveTicket(ticketId);
      await fetchTicketDetails(); // Refresh ticket data
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
      setError('Failed to resolve ticket');
    }
  };

  const closeTicket = async () => {
    try {
      await apiService.closeTicket(ticketId);
      await fetchTicketDetails(); // Refresh ticket data
    } catch (err) {
      console.error('Failed to close ticket:', err);
      setError('Failed to close ticket');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'platform_admin') {
      console.log('User is not platform admin, redirecting');
      router.push('/select-role');
      return;
    }
    
    if (ticketId) {
      console.log('Platform admin authenticated, fetching ticket details:', { user, isAuthenticated });
      fetchTicketDetails();
    }
  }, [ticketId, isAuthenticated, user, router]);

  const getStatusConfig = (status: string) => {
    const configs = {
      'open': { 
        icon: AlertCircle, 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      'in_progress': { 
        icon: Loader2, 
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      'resolved': { 
        icon: CheckCircle, 
        color: 'bg-green-50 text-green-700 border-green-200',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'closed': { 
        icon: XCircle, 
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      },
      'reopened': { 
        icon: AlertTriangle, 
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (!isAuthenticated || user?.role !== 'platform_admin') {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg">Ticket not found</p>
          <Button onClick={() => router.push('/platform/support')} className="bg-primary hover:bg-primary/90">
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/platform/support')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tickets
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.ticket_id}</h1>
              <Badge className={`${statusConfig.color} font-medium`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1 text-lg">{ticket.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Tenant: #{ticket.tenant}</span>
              <span>Created by: User #{ticket.created_by}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`bg-${getPriorityColor(ticket.priority).replace('text-', '')} font-medium`}>
            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
          </Badge>
          {ticket.is_urgent && (
            <Badge className="bg-red-100 text-red-800 border-red-200 font-medium">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Urgent
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Ticket Details */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Ticket Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Category</span>
                </div>
                <span className="text-sm text-gray-900 capitalize">{ticket.category.replace('_', ' ')}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Created</span>
                </div>
                <span className="text-sm text-gray-900">{formatDate(ticket.created_at)}</span>
              </div>

              {ticket.requires_callback && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Callback Request</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {ticket.callback_phone && (
                      <div className="text-blue-700">Phone: {ticket.callback_phone}</div>
                    )}
                    {ticket.callback_preferred_time && (
                      <div className="text-blue-700">Preferred Time: {ticket.callback_preferred_time}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-gray-200 shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="space-y-3">
              {ticket.status === 'open' && (
                <Button 
                  onClick={assignToMe} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign to Me
                </Button>
              )}
              
              {ticket.status === 'in_progress' && (
                <Button 
                  onClick={resolveTicket} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
              
              {ticket.status === 'resolved' && (
                <Button 
                  onClick={closeTicket} 
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Close Ticket
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {statusUpdate && (
                  <Button 
                    onClick={() => updateTicketStatus(statusUpdate)} 
                    disabled={statusUpdate === ticket.status}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Update
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Messages */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
            </div>
            
            {/* Messages List */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
              {!Array.isArray(messages) || messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg">No messages yet</p>
                  <p className="text-gray-400 text-sm">Start the conversation by sending a message below</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${
                      message.is_system_message
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.is_system_message 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {message.is_system_message ? 'System' : `User #${message.sender}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Enhanced Send Message */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 resize-none border-gray-300 focus:border-primary focus:ring-primary"
                  rows={3}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  className="self-end bg-primary hover:bg-primary/90 px-6"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
          </div>

      {/* Enhanced Ticket Description */}
      <Card className="p-6 border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        </div>
        <div className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
          {ticket.summary || 'No description provided'}
        </div>
      </Card>
    </div>
  );
}
 
 