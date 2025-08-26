"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, TrendingUp, ArrowUp, RefreshCw, Search, Filter, AlertTriangle } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import CaptureLeadModal from '@/components/exhibition/CaptureLeadModal';

interface ExhibitionLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  customer_type?: string;
  status?: string;
  created_at: string;
  notes?: string;
  city?: string;
  store?: number;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

// Add proper API response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function ManagerExhibitionPage() {
  const [leads, setLeads] = useState<ExhibitionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  useEffect(() => {
    fetchExhibitionLeads();
  }, []);

  const testAPI = async () => {
    try {
      console.log('🧪 Testing API manually...');
      const response = await apiService.getExhibitionLeads();
      console.log('🧪 Test API response:', response);
      alert(`API Test Result: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('🧪 Test API error:', error);
      alert(`API Test Error: ${error}`);
    }
  };

  const fetchExhibitionLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching exhibition leads...');
      
      // Fetch exhibition leads for the manager's store
      const response = await apiService.getExhibitionLeads();
      console.log('📡 Exhibition leads API response:', response);
      
      // Handle the actual API response format with proper typing
      if (response && typeof response === 'object') {
        if ('success' in response && response.success && 'data' in response) {
          // Handle ApiResponse<ExhibitionLead[]> format
          if (Array.isArray(response.data)) {
            console.log('✅ Using response.data (array):', response.data);
            setLeads(response.data);
          } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
            // Handle paginated response format with type assertion
            const resultsData = (response.data as any).results;
            if (Array.isArray(resultsData)) {
              console.log('✅ Using response.data.results (array):', resultsData);
              setLeads(resultsData);
            } else {
              console.warn('⚠️ Exhibition leads response.data.results is not an array:', resultsData);
              setLeads([]);
              setError(`Invalid response.data.results format: ${JSON.stringify(resultsData)}`);
            }
          } else {
            console.warn('⚠️ Exhibition leads response.data is not in expected format:', response.data);
            setLeads([]);
            setError(`Invalid response.data format: ${JSON.stringify(response.data)}`);
          }
        } else if (Array.isArray(response)) {
          // Handle direct array response
          console.log('✅ Using response directly (array):', response);
          setLeads(response);
        } else {
          console.warn('⚠️ Exhibition leads response is not in expected format:', response);
          setLeads([]);
          setError(`Invalid API response format: ${JSON.stringify(response)}`);
        }
      } else {
        console.warn('⚠️ Exhibition leads response is not an object:', response);
        setLeads([]);
        setError(`Invalid API response: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      console.error('❌ Error fetching exhibition leads:', error);
      setLeads([]);
      setError(`API Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const promoteLead = async (leadId: number) => {
    try {
      const response = await apiService.promoteExhibitionLead(leadId.toString());
      if (response.success) {
        // Refresh the leads list
        await fetchExhibitionLeads();
      }
    } catch (error) {
      console.error('Error promoting lead:', error);
    }
  };

  const handleCaptureLead = async (leadData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city?: string;
    notes?: string;
    customer_type: string;
  }) => {
    try {
      const response = await apiService.createExhibitionLead(leadData);
      if (response.success) {
        // Refresh the leads list
        await fetchExhibitionLeads();
        console.log('✅ Exhibition lead captured successfully:', response.data);
      } else {
        console.error('❌ Failed to capture exhibition lead:', response);
        setError('Failed to capture lead. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error capturing exhibition lead:', error);
      setError(`Error capturing lead: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const filteredLeads = Array.isArray(leads) ? leads.filter(lead => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (lead.phone && lead.phone.includes(searchTerm)) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const readyToPromote = Array.isArray(leads) ? leads.filter(lead => lead.status === 'exhibition').length : 0;
  const alreadyPromoted = Array.isArray(leads) ? leads.filter(lead => lead.status === 'promoted').length : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Leads</h1>
          <p className="text-gray-600 mt-2">Manage and promote exhibition leads to your main customer database.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => setIsCaptureModalOpen(true)}
          >
            <Gift className="w-4 h-4 mr-2" />
            + Capture Lead
          </Button>
          <Button variant="outline" onClick={fetchExhibitionLeads}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={testAPI}>
            <Search className="w-4 h-4 mr-2" />
            Test API
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exhibition Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                <p className="text-xs text-gray-500 mt-1">All leads captured during exhibitions</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Promote</p>
                <p className="text-2xl font-bold text-gray-900">{readyToPromote}</p>
                <p className="text-xs text-gray-500 mt-1">Leads still in exhibition status</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Already Promoted</p>
                <p className="text-2xl font-bold text-green-600">{alreadyPromoted}</p>
                <p className="text-xs text-gray-500 mt-1">Successfully moved to main system</p>
              </div>
              <ArrowUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="exhibition">Exhibition</option>
                <option value="promoted">Promoted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exhibition Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Exhibition Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exhibition leads found.
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(filteredLeads) && filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{lead.first_name} {lead.last_name}</h3>
                      <Badge variant="secondary">Exhibition Lead</Badge>
                      <Badge variant="outline">{lead.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        {lead.email}
                      </span>
                      <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status === 'exhibition' && (
                      <Button
                        onClick={() => promoteLead(lead.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Promote to Main Customer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capture Lead Modal */}
      <CaptureLeadModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onSubmit={handleCaptureLead}
      />
    </div>
  );
}
