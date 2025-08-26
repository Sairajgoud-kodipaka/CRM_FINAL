"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { apiService, Client } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, TrendingUp, Calendar, Phone, Mail, MapPin, ArrowUpRight, Filter, Plus, RefreshCw } from "lucide-react";
import { ExhibitionLeadModal } from "@/components/exhibition/ExhibitionLeadModal";

export default function BusinessAdminExhibitionPage() {
  const { toast } = useToast();
  const [exhibitionLeads, setExhibitionLeads] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [promotingCustomer, setPromotingCustomer] = useState<number | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  useEffect(() => {
    fetchExhibitionLeads();
  }, []);

  const fetchExhibitionLeads = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExhibitionLeads();
      
      if (response.success && response.data) {
        const clients = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any)?.results || (response.data as any)?.data || [];
        
        setExhibitionLeads(clients);
      }
    } catch (error) {
      console.error('Error fetching exhibition leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exhibition leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToMainCustomer = async (customerId: number) => {
    try {
      setPromotingCustomer(customerId);
      
      // Use the exhibition-specific promotion API
      const response = await apiService.promoteExhibitionLead(customerId.toString());
      
      if (response.success) {
        toast({
          title: "Success!",
          description: "Customer promoted to main customer database",
          variant: "success",
        });
        
        // Refresh the list
        fetchExhibitionLeads();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to promote customer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error promoting customer:', error);
      toast({
        title: "Error",
        description: "Failed to promote customer",
        variant: "destructive",
      });
    } finally {
      setPromotingCustomer(null);
    }
  };

  const filteredLeads = exhibitionLeads.filter(lead => {
    const matchesSearch = 
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: exhibitionLeads.length,
    readyToPromote: exhibitionLeads.filter(lead => lead.status === 'exhibition').length,
    alreadyPromoted: exhibitionLeads.filter(lead => lead.status === 'lead').length,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
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
          <h1 className="text-2xl font-semibold text-text-primary">Exhibition Leads</h1>
          <p className="text-text-secondary mt-1">Manage and promote exhibition leads to your main customer database</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchExhibitionLeads}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button className="btn-primary text-sm flex items-center gap-1" onClick={() => setShowLeadModal(true)}>
            <Plus className="w-4 h-4" /> Capture Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-sm text-text-secondary font-medium">Total Exhibition Leads</div>
          <div className="text-xs text-text-secondary">All leads captured during exhibitions</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.readyToPromote}</div>
          <div className="text-sm text-text-secondary font-medium">Ready to Promote</div>
          <div className="text-xs text-text-secondary">Leads still in exhibition status</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary text-green-600">{stats.alreadyPromoted}</div>
          <div className="text-sm text-text-secondary font-medium">Already Promoted</div>
          <div className="text-xs text-text-secondary">Successfully moved to main system</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, phone, or email..."
              className="pl-10 w-full md:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="exhibition">Exhibition</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Contact Info</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        {lead.first_name} {lead.last_name}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Exhibition Lead
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Exhibition
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {lead.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      Created: {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {lead.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteToMainCustomer(lead.id)}
                        disabled={promotingCustomer === lead.id}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {promotingCustomer === lead.id ? 'Promoting...' : 'Promote to Main Customer'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    {exhibitionLeads.length === 0 ? 'No exhibition leads found' : 'No leads match your search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredLeads.length > 0 && (
          <div className="text-sm text-text-secondary text-center py-2">
            Showing {filteredLeads.length} of {exhibitionLeads.length} exhibition leads
          </div>
        )}
      </Card>

      {/* Exhibition Lead Modal */}
      <ExhibitionLeadModal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          fetchExhibitionLeads();
        }}
      />
    </div>
  );
}
