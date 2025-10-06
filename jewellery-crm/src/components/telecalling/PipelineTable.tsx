'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, 
  Eye, 
  Search, 
  Filter, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { telecallingApiService, Lead, LeadListResponse } from '@/services/telecallingApi';
import { useAuth } from '@/hooks/useAuth';
import { PIPELINE_STATUSES, getStatusById, getStatusColor } from '@/constants/pipeline';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PipelineTableProps {
  onViewPipeline?: (lead: Lead) => void;
}

export function PipelineTable({ onViewPipeline }: PipelineTableProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageSize] = useState(15);

  const fetchLeads = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching Google Sheets leads for pipeline...');
      
      // Fetch Google Sheets leads with pagination
      const response: LeadListResponse = await telecallingApiService.getLeads({
        page: page,
        limit: pageSize,
        assignedTo: user?.id?.toString() // Only get leads assigned to current telecaller
      });
      
      console.log('📡 Pipeline leads API response:', response);
      
          if (response && response.results) {
            setLeads(response.results);
            // Calculate total pages from count and page size
            const totalPages = Math.ceil(response.count / pageSize);
            setTotalPages(totalPages);
            setTotalLeads(response.count);
            setCurrentPage(page);
            console.log(`✅ Loaded ${response.results.length} leads for pipeline (page ${page}/${totalPages})`);
          } else {
            console.warn('⚠️ Unexpected pipeline leads response format:', response);
            setLeads([]);
            setError('Unexpected response format from server');
          }
    } catch (err) {
      console.error('❌ Error fetching pipeline leads:', err);
      
      if (err instanceof Error && (err.message.includes('Network') || err.message.includes('fetch'))) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (err instanceof Error && err.message.includes('403')) {
        setError('You do not have permission to view leads. Please contact your manager.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load leads');
      }
      
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, []);

  const handleViewPipeline = (lead: Lead) => {
    if (onViewPipeline) {
      onViewPipeline(lead);
    } else {
      router.push(`/telecaller/pipeline/${lead.id}`);
    }
  };

  const handleCall = (lead: Lead) => {
    // Implement call functionality
    console.log('Calling:', lead.name);
    router.push(`/telecaller/call?phone=${lead.phone}&name=${lead.name}&leadId=${lead.id}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLeads(newPage);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.masked_phone?.includes(searchTerm);
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    // Priority filter
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    
    // Quality filter (using source as quality indicator)
    const matchesQuality = qualityFilter === 'all' || lead.source === qualityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesQuality;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusById(status);
    if (!statusConfig) {
      return <Badge variant="outline">{status}</Badge>;
    }
    
    return (
      <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colorMap: Record<string, string> = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  };

  const getQualityBadge = (quality: string) => {
    const colorMap: Record<string, string> = {
      'hot': 'bg-red-100 text-red-800',
      'warm': 'bg-orange-100 text-orange-800',
      'cold': 'bg-blue-100 text-blue-800',
    };
    return colorMap[quality] || 'bg-gray-100 text-gray-800';
  };

  // Statistics - Note: These are calculated from current page only
  // For accurate total statistics, we would need to fetch all leads or add statistics to API
  const totalLeadsCount = leads.length; // Current page leads count
  const activeLeads = leads.filter(l => !['converted', 'not_interested'].includes(l.status)).length;
  const completedLeads = leads.filter(l => ['converted', 'not_interested'].includes(l.status)).length;
  const newLeads = leads.filter(l => l.status === 'new').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <Button onClick={() => fetchLeads(currentPage)} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Lead Pipeline</h1>
          <p className="text-text-secondary mt-1">Manage your leads through the sales pipeline</p>
        </div>
        <Button onClick={() => fetchLeads(currentPage)} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{totalLeads}</p>
                <p className="text-sm text-text-secondary">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{activeLeads}</p>
                <p className="text-sm text-text-secondary">Active Pipeline (Page)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{newLeads}</p>
                <p className="text-sm text-text-secondary">New Leads (Page)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-text-primary">{completedLeads}</p>
                <p className="text-sm text-text-secondary">Completed (Page)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {PIPELINE_STATUSES.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Leads Pipeline ({filteredLeads.length} leads)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.masked_phone || lead.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getPriorityBadge(lead.priority)}>
                          {lead.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getQualityBadge(lead.source)}>
                          {lead.source.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags?.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {lead.tags && lead.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{lead.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(lead);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPipeline(lead);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Pipeline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No leads found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalLeads)} of {totalLeads} leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
