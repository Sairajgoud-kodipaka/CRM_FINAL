'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Building2,
  MessageSquare,
  Eye,
  Calendar,
  Phone,
  Mail
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

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export default function PlatformSupportTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isHydrated } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getSupportTickets({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter || undefined,
        priority: priorityFilter === 'all' ? undefined : priorityFilter || undefined,
      });
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        const ticketsData = Array.isArray(response.data) ? response.data : (response.data as any).results || [];
        console.log('Tickets data:', ticketsData);
        setTickets(ticketsData);
      } else {
        console.log('No tickets data, setting empty array');
        setTickets([]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    
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
    
    console.log('Platform admin authenticated, fetching tickets:', { user, isAuthenticated });
    fetchTickets();
  }, [searchTerm, statusFilter, priorityFilter, isAuthenticated, user, router, isHydrated]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      case 'open': return 'destructive';
      case 'in_progress': return 'outline';
      case 'reopened': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const calculateStats = (): TicketStats => {
    const stats = {
      total: tickets.length,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
    };

    tickets.forEach(ticket => {
      switch (ticket.status) {
        case 'open':
          stats.open++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'resolved':
          stats.resolved++;
          break;
        case 'closed':
          stats.closed++;
          break;
      }
      if (ticket.is_urgent) stats.urgent++;
    });

    return stats;
  };

  const groupTicketsByStatus = () => {
    const grouped = {
      open: tickets.filter(t => t.status === 'open'),
      inProgress: tickets.filter(t => t.status === 'in_progress'),
      resolved: tickets.filter(t => t.status === 'resolved'),
      closed: tickets.filter(t => t.status === 'closed'),
    };

    return grouped;
  };

  const stats = calculateStats();
  const groupedTickets = groupTicketsByStatus();

  if (!isAuthenticated || user?.role !== 'platform_admin') {
    return <div>Loading...</div>;
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and track support requests across all tenants</p>
        </div>
        <Button onClick={fetchTickets} disabled={loading} className="flex items-center gap-2 w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Open</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Closed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tickets by ID, subject, or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="reopened">Reopened</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Buckets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Loading tickets...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600">No support tickets match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Open Tickets */}
          {groupedTickets.open.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Open Tickets</h2>
                <Badge variant="destructive" className="ml-2">{groupedTickets.open.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {groupedTickets.open.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Tickets */}
          {groupedTickets.inProgress.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">In Progress</h2>
                <Badge variant="outline" className="ml-2">{groupedTickets.inProgress.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {groupedTickets.inProgress.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {/* Resolved Tickets */}
          {groupedTickets.resolved.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Resolved</h2>
                <Badge variant="default" className="ml-2">{groupedTickets.resolved.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {groupedTickets.resolved.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {/* Closed Tickets Bucket */}
          {groupedTickets.closed.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Closed Tickets</h2>
                <Badge variant="secondary" className="ml-2">{groupedTickets.closed.length}</Badge>
              </div>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {groupedTickets.closed.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} compact />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Ticket Card Component
function TicketCard({ ticket, compact = false }: { ticket: SupportTicket; compact?: boolean }) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      case 'open': return 'destructive';
      case 'in_progress': return 'outline';
      case 'reopened': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${compact ? 'border-gray-200 bg-gray-50' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(ticket.status)}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs sm:text-sm font-medium text-gray-900 truncate">{ticket.ticket_id}</p>
                <p className="text-xs text-gray-500">Tenant #{ticket.tenant}</p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(ticket.status)} className="text-xs flex-shrink-0">
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Title */}
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base" title={ticket.title}>
              {ticket.title}
            </h3>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-1 ${getPriorityColor(ticket.priority)}`}
            >
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </Badge>
            {ticket.is_urgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            <Link 
              href={`/platform/support/${ticket.id}`}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
 
 