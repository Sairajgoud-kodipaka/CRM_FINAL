'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/lib/api-service';
import { AlertTriangle, Clock, User, CheckCircle, XCircle, Eye, MessageSquare, Plus, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CreateEscalationModal from '@/components/escalations/CreateEscalationModal';
import AddNoteModal from '@/components/escalations/AddNoteModal';
import { toast } from 'sonner';

interface Escalation {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_by: {
    id: number;
    first_name: string;
    last_name: string;
  };
  assigned_to?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  due_date: string;
  is_overdue: boolean;
  time_to_resolution?: number;
  sla_compliance?: boolean;
  notes: any[];
}

export default function ManagerEscalationsPage() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
  });
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  useEffect(() => {
    fetchEscalations();
    fetchStats();
  }, [filters]);

  const fetchEscalations = async () => {
    try {
      const response = await apiService.getEscalations({
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        search: filters.search || undefined,
      });
      
      if (response.success) {
        const data = response.data as any;
        if (Array.isArray(data)) {
          setEscalations(data);
        } else if (data && data.results && Array.isArray(data.results)) {
          setEscalations(data.results);
        } else {
          setEscalations([]);
        }
      } else {
        setEscalations([]);
      }
    } catch (error) {
      console.error('Error fetching escalations:', error);
      setEscalations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getEscalationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = () => {
    fetchEscalations();
    fetchStats();
  };

  const handleStatusChange = async (escalationId: string, newStatus: string) => {
    try {
      const response = await apiService.changeEscalationStatus(escalationId, newStatus);
      if (response.success) {
        toast.success('Escalation status updated successfully');
        fetchEscalations();
        fetchStats();
      } else {
        toast.error('Failed to update escalation status');
      }
    } catch (error) {
      console.error('Error updating escalation status:', error);
      toast.error('Failed to update escalation status');
    }
  };

  const handleAssignToMe = async (escalationId: string) => {
    try {
      const response = await apiService.assignEscalation(escalationId, user?.id || 0);
      if (response.success) {
        toast.success('Escalation assigned to you successfully');
        fetchEscalations();
        fetchStats();
      } else {
        toast.error('Failed to assign escalation');
      }
    } catch (error) {
      console.error('Error assigning escalation:', error);
      toast.error('Failed to assign escalation');
    }
  };

  const handleAddNote = (escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setShowAddNoteModal(true);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_customer':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Escalations</h1>
            <p className="text-text-secondary mt-1">Manage customer escalations and issues</p>
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
          <h1 className="text-3xl font-bold text-text-primary">Escalations</h1>
          <p className="text-text-secondary mt-1">Manage customer escalations and issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <CreateEscalationModal onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total_escalations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold">{stats.open_escalations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold">{stats.overdue_escalations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold">{stats.resolved_today || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search escalations..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_customer">Pending Customer</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="product_issue">Product Issue</SelectItem>
                  <SelectItem value="service_quality">Service Quality</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {escalations.map((escalation) => (
          <Card 
            key={escalation.id}
            className={`transition-all duration-200 hover:shadow-lg ${
              escalation.is_overdue ? 'border-l-4 border-l-red-500' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getPriorityIcon(escalation.priority)}
                  <h3 className="font-semibold text-text-primary line-clamp-2">
                    {escalation.title}
                  </h3>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={getPriorityColor(escalation.priority)}>
                    {escalation.priority}
                  </Badge>
                  <Badge className={getStatusColor(escalation.status)}>
                    {escalation.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {escalation.client.first_name} {escalation.client.last_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(escalation.created_at)}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-text-secondary line-clamp-3 mb-3">
                {escalation.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Category:</span>
                  <span className="font-medium">{escalation.category.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Created by:</span>
                  <span className="font-medium">
                    {escalation.created_by.first_name} {escalation.created_by.last_name}
                  </span>
                </div>
                {escalation.assigned_to && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Assigned to:</span>
                    <span className="font-medium">
                      {escalation.assigned_to.first_name} {escalation.assigned_to.last_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Due:</span>
                  <span className={`font-medium ${escalation.is_overdue ? 'text-red-600' : ''}`}>
                    {formatDate(escalation.due_date)}
                  </span>
                </div>
                {escalation.notes && escalation.notes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Notes:</span>
                    <span className="font-medium">{escalation.notes.length}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddNote(escalation)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Add Note
                </Button>
                {!escalation.assigned_to && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignToMe(escalation.id.toString())}
                  >
                    Assign to Me
                  </Button>
                )}
              </div>

              {escalation.status === 'open' && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(escalation.id.toString(), 'in_progress')}
                  >
                    Start Working
                  </Button>
                </div>
              )}
              {escalation.status === 'in_progress' && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    onClick={() => handleStatusChange(escalation.id.toString(), 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {escalations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Escalations</h3>
            <p className="text-text-secondary">No escalations found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && selectedEscalation && (
        <AddNoteModal
          escalation={selectedEscalation}
          onClose={() => {
            setShowAddNoteModal(false);
            setSelectedEscalation(null);
          }}
          onSuccess={() => {
            setShowAddNoteModal(false);
            setSelectedEscalation(null);
            fetchEscalations();
          }}
        />
      )}
    </div>
  );
} 