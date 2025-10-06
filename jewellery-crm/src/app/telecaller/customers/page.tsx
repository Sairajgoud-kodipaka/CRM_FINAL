'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Loader2, AlertCircle, Users, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { telecallingApiService, Lead, CallRequest, LeadListResponse } from '@/services/telecallingApi';
import { useAuth } from '@/hooks/useAuth';
import { CallPanel } from '@/components/telecalling/CallPanel';
import { useRouter } from 'next/navigation';

const LeadRow = ({ 
  lead, 
  onCall, 
  onView 
}: { 
  lead: Lead; 
  onCall: (lead: Lead) => void; 
  onView: (lead: Lead) => void; 
}) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50">
    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
      <div>
        <p className="font-medium text-gray-900">{lead.name}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">{lead.masked_phone || lead.phone}</p>
      </div>
      <div>
        <Badge 
          variant="outline" 
          className={`${
            lead.status === 'new' ? 'bg-blue-100 text-blue-800 border-blue-300' :
            lead.status === 'contacted' ? 'bg-green-100 text-green-800 border-green-300' :
            lead.status === 'qualified' ? 'bg-purple-100 text-purple-800 border-purple-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }`}
        >
          {lead.status}
        </Badge>
        </div>
      <div>
        <Badge 
          variant="outline"
          className={`${
            lead.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
            lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }`}
        >
          {lead.priority}
        </Badge>
      </div>
      <div>
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
          warm
        </Badge>
      </div>
      <div>
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
      </div>
    </div>
        <div className="flex gap-2">
          <Button
            size="sm"
        onClick={() => onCall(lead)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
        <Phone className="w-4 h-4" />
            Call
          </Button>
          <Button
            size="sm"
        variant="outline"
        onClick={() => onView(lead)}
          >
            View
          </Button>
        </div>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Leads</h3>
    <p className="text-gray-600 mb-4">{error}</p>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

export default function TelecallerCustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageSize] = useState(15);
  
  // Call panel state
  const [callPanelOpen, setCallPanelOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching Google Sheets leads for telecaller...');
      
      // Fetch Google Sheets leads with pagination
      const response: LeadListResponse = await telecallingApiService.getLeads({
        page: page,
        limit: pageSize,
        assignedTo: user?.id ? "me" : undefined // Only get leads assigned to current telecaller
      });
      
      console.log('📡 Google Sheets leads API response:', response);
      
      if (response && response.results) {
        setLeads(response.results);
        // Calculate total pages from count and page size
        const totalPages = Math.ceil(response.count / pageSize);
        setTotalPages(totalPages);
        setTotalLeads(response.count);
        setCurrentPage(page);
        console.log(`✅ Loaded ${response.results.length} leads (page ${page}/${totalPages})`);
      } else {
        console.warn('⚠️ Unexpected leads response format:', response);
        setLeads([]);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error('❌ Error fetching Google Sheets leads:', err);
      
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

  const handleCall = async (lead: Lead) => {
    try {
      setSelectedLead(lead);
      setCallPanelOpen(true);
    } catch (err) {
      console.error('Error preparing call:', err);
      alert('Failed to prepare call');
    }
  };

  const handleView = (lead: Lead) => {
    // Navigate to the dedicated lead view page
    router.push(`/telecaller/leads/${lead.id}`);
  };

  const handleCallEnded = (callLog: CallRequest) => {
    // Update lead status based on call outcome
    const lead = leads.find(l => l.id === callLog.lead);
    if (lead) {
      let newStatus = lead.status;
      
      if (callLog.sentiment === 'positive') {
        newStatus = 'qualified';
      } else if (callLog.sentiment === 'negative') {
        newStatus = 'not_interested';
      } else if (callLog.follow_up_required) {
        newStatus = 'appointment_set';
      }

      // Update the lead in the list
      setLeads(prev => prev.map(l => 
        l.id === lead.id 
          ? { ...l, status: newStatus, notes: callLog.notes || l.notes }
          : l
      ));
    }

    // Close call panel
    setCallPanelOpen(false);
    setSelectedLead(null);
  };

  const filteredLeads = (Array.isArray(leads) ? leads : []).filter(lead => {
    // Add safety checks for lead properties
    if (!lead) {
      console.warn('Invalid lead data:', lead);
      return false;
    }
    
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.masked_phone?.includes(searchTerm) ||
                         lead.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLeads(newPage);
    }
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => fetchLeads(currentPage)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assigned Leads</h1>
            <p className="text-sm text-gray-600">Manage your assigned leads and make calls</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">{totalLeads} total leads</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="appointment_set">Appointment Set</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredLeads.length} assignments
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Leads Table */}
        <Card>
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Customer</div>
                <div>Phone</div>
                <div>Status</div>
                <div>Priority</div>
                <div>Quality</div>
                <div>Interests</div>
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading leads...</span>
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onCall={handleCall}
                    onView={handleView}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your filters to see more leads.'
                    : 'You don\'t have any assigned leads yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
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

      {/* Call Panel */}
      {selectedLead && (
        <CallPanel
          lead={selectedLead}
          isOpen={callPanelOpen}
          onClose={() => {
            setCallPanelOpen(false);
            setSelectedLead(null);
          }}
          onCallEnded={handleCallEnded}
        />
      )}
    </div>
  );
}