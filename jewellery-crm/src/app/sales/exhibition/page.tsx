"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Search, Users, TrendingUp, ArrowUpRight, User, Phone, Mail, Calendar, MapPin } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';
import CaptureLeadModal from '@/components/exhibition/CaptureLeadModal';

// Define Client interface locally since it's not exported from types
interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status?: string;
  city?: string;
  lead_source?: string;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function SalesExhibitionPage() {
  const [exhibitionLeads, setExhibitionLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    readyToPromote: 0,
    alreadyPromoted: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [exhibitionTags, setExhibitionTags] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExhibitionLeads();
    fetchStats();
    // Fetch tags in background, don't block on errors
    fetchExhibitionTags().catch(() => {
      // Silently fail - form will work without tags
    });
  }, []);

  const fetchExhibitionTags = async () => {
    try {
      const response = await apiService.getExhibitionTags();
      if (response.success && Array.isArray(response.data)) {
        setExhibitionTags(response.data);
      }
    } catch (error) {
      console.error('Error fetching exhibition tags:', error);
      // Set empty array on error so form still works without tags
      setExhibitionTags([]);
    }
  };

  const fetchExhibitionLeads = async () => {
    try {
      setLoading(true);


      const response = await apiService.getExhibitionLeads();

      // Debug logging


      if (response.success && response.data) {
        // Handle different data formats
        let leadsData: any[] = [];

        if (Array.isArray(response.data)) {
          leadsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check for common response formats
          const data = response.data as any;
          if (data.results && Array.isArray(data.results)) {
            leadsData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            leadsData = data.data;
          } else {
            leadsData = [data];
          }
        }


        setExhibitionLeads(leadsData);
      } else {


        // Ensure exhibitionLeads is always an array
        setExhibitionLeads([]);
        toast({
          title: "Error",
          description: "Failed to fetch exhibition leads",
          variant: "destructive",
        });
      }
    } catch (error: any) {


      // Ensure exhibitionLeads is always an array even on error
      setExhibitionLeads([]);
      toast({
        title: "Error",
        description: "Failed to fetch exhibition leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getExhibitionStats();
      if (response.success && response.data) {
        // Map backend stats to frontend stats
        setStats({
          total: response.data.total || 0,
          readyToPromote: response.data.exhibition || 0,
          alreadyPromoted: response.data.promoted || 0
        });
      }
    } catch (error) {

    }
  };

  const promoteLead = async (clientId: string) => {
    try {
      const response = await apiService.promoteExhibitionLead(clientId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Lead promoted successfully!",
        });
        fetchExhibitionLeads();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to promote lead",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to promote lead",
        variant: "destructive",
      });
    }
  };

  const handleCaptureLead = async (leadData: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone: string;
    city?: string;
    notes?: string;
    customer_type: string;
    exhibition_name?: string;
    exhibition_date?: string;
    exhibition_tag?: number;
    customer_interests_input?: string[];
  }) => {
    try {
      const response = await apiService.createExhibitionLead(leadData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Exhibition lead captured successfully!",
        });

        // Refresh the leads list and stats
        fetchExhibitionLeads();
        fetchStats();
        setShowAddModal(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to capture lead",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating exhibition lead:', error);
      let errorMessage = "Failed to capture lead";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filteredLeads = Array.isArray(exhibitionLeads) ? exhibitionLeads.filter(lead => {
    const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Only show leads that are currently in exhibition status
    // Promoted leads (status !== 'exhibition') should not appear in this list
    if (filterStatus === 'all') return lead.status === 'exhibition' && matchesSearch;
    if (filterStatus === 'exhibition') return lead.status === 'exhibition' && matchesSearch;
    if (filterStatus === 'promoted') return false; // No promoted leads in this view

    return lead.status === 'exhibition' && matchesSearch;
  }) : [];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
                     <h1 className="text-3xl font-bold text-gray-900">Exhibition Leads</h1>
           <p className="text-gray-600 mt-2">
             Capture and manage leads from exhibitions. Promote quality leads to your main customer system.
           </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddModal(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Capture Lead
          </Button>
          <Button onClick={fetchExhibitionLeads} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibition Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All leads captured during exhibitions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Promote</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.readyToPromote}</div>
            <p className="text-xs text-muted-foreground">Leads still in exhibition status</p>
          </CardContent>
        </Card>

                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Captured</CardTitle>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-green-600">{stats.total}</div>
             <p className="text-xs text-muted-foreground">All leads captured during exhibitions</p>
           </CardContent>
         </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="all">All Exhibition Leads</SelectItem>
                 <SelectItem value="exhibition">Ready to Promote</SelectItem>
               </SelectContent>
            </Select>
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
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exhibition leads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Exhibition leads will appear here when customers are added with 'Exhibition' as their lead source.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {lead.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {lead.email}
                          </span>
                        )}
                        {lead.city && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {lead.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={lead.status === 'exhibition' ? 'secondary' : 'default'}>
                      {lead.status === 'exhibition' ? 'Exhibition Lead' : 'Promoted'}
                    </Badge>
                    {lead.status === 'exhibition' && (
                      <Button
                        onClick={() => promoteLead(lead.id.toString())}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowUpRight className="w-4 h-4 mr-1" />
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
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCaptureLead}
        exhibitionTags={exhibitionTags}
      />
    </div>
  );
}
