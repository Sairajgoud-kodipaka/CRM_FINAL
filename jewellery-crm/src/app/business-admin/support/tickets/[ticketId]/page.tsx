'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  MinusCircle,
  Phone,
  Calendar,
  Tag,
  AlertTriangle,
  Info
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface SupportTicket {
  id: number;
  ticket_id: string;
  title: string;
  summary: string;
  category: string;
  priority: string;
  status: string;
  created_by: number;
  assigned_to?: number;
  tenant: number;
  created_at: string;
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

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const ticketId = params.ticketId as string;
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    if (ticketId) {
      console.log('User authenticated, fetching ticket details:', { user, isAuthenticated });
      fetchTicketDetails();
    }
  }, [ticketId, isAuthenticated, user, router]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      const response = await apiService.createTicketMessage(ticketId, {
        content: newMessage,
        is_internal: false,
        message_type: 'text'
      });
      
      if (response.success) {
        setNewMessage('');
        // Refresh messages
        const messagesResponse = await apiService.getTicketMessages(ticketId);
        if (messagesResponse.success && messagesResponse.data) {
          const messagesData = Array.isArray(messagesResponse.data) ? messagesResponse.data : (messagesResponse.data as any).results || [];
          setMessages(messagesData);
        }
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

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

  const getPriorityConfig = (priority: string) => {
    const configs = {
      'low': { color: 'bg-gray-100 text-gray-800', textColor: 'text-gray-600' },
      'medium': { color: 'bg-blue-100 text-blue-800', textColor: 'text-blue-600' },
      'high': { color: 'bg-orange-100 text-orange-800', textColor: 'text-orange-600' },
      'critical': { color: 'bg-red-100 text-red-800', textColor: 'text-red-600' },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
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

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg">{error || 'Ticket not found'}</p>
          <Button onClick={() => router.back()} className="bg-primary hover:bg-primary/90">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${priorityConfig.color} font-medium`}>
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
                        : message.is_internal
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.is_system_message 
                            ? 'bg-blue-100 text-blue-600' 
                            : message.is_internal
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {message.is_system_message ? 'System' : 'You'}
                          </span>
                          {message.is_internal && (
                            <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
                              Internal
                            </Badge>
                          )}
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 resize-none border-gray-300 focus:border-primary focus:ring-primary"
                  rows={3}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="self-end bg-primary hover:bg-primary/90 px-6"
                >
                  {sendingMessage ? (
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