"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { apiService, Client } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, TrendingUp, Calendar, Phone, Mail, MapPin, ArrowUpRight, Filter, Plus } from "lucide-react";
import { ExhibitionLeadModal } from "@/components/exhibition/ExhibitionLeadModal";

export default function ExhibitionPage() {
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
    promoted: exhibitionLeads.filter(lead => lead.status === 'lead').length,
    exhibition: exhibitionLeads.filter(lead => lead.status === 'exhibition').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Leads</h1>
          <p className="text-gray-600 mt-2">
            Manage and promote exhibition leads to your main customer database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowLeadModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Capture Lead
          </Button>
          <Button 
            onClick={fetchExhibitionLeads}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibition Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All leads captured during exhibitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Promote</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.exhibition}</div>
            <p className="text-xs text-muted-foreground">
              Leads still in exhibition status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Already Promoted</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.promoted}</div>
            <p className="text-xs text-muted-foreground">
              Successfully moved to main system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
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
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="exhibition">Exhibition</SelectItem>
                  <SelectItem value="lead">Promoted</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exhibition leads found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Exhibition leads will appear here when customers are added with 'Exhibition' as their lead source"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <Badge variant={lead.status === 'exhibition' ? 'outline' : 'default'}>
                          {lead.status === 'exhibition' ? 'Exhibition Lead' : 'Promoted'}
                        </Badge>
                        {lead.lead_source && (
                          <Badge variant="secondary" className="capitalize">
                            {lead.lead_source}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{lead.email || 'No email'}</span>
                        </div>
                        {lead.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{lead.address}{lead.city && `, ${lead.city}`}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created:</span> {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {lead.summary_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Notes:</span> {lead.summary_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {lead.status === 'exhibition' && (
                        <Button
                          onClick={() => promoteToMainCustomer(lead.id)}
                          disabled={promotingCustomer === lead.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {promotingCustomer === lead.id ? (
                            "Promoting..."
                          ) : (
                            <>
                              <ArrowUpRight className="w-4 h-4 mr-2" />
                              Promote to Main Customer
                            </>
                          )}
                        </Button>
                      )}
                      
                      {lead.status === 'lead' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✓ Already Promoted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exhibition Lead Capture Modal */}
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
