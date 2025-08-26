'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowLeft, Target, Loader2, Edit, User } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useRouter, useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CustomerInStage {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  customer_type: string;
  pipeline_stage: string;
  expected_value?: number;
  probability?: number;
  assigned_to?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  sales_representative?: {
    id: number;
    username: string;
    full_name: string;
    store_name?: string;
  };
  preferred_metal?: string;
  preferred_stone?: string;
  budget_range?: string;
  lead_source?: string;
  next_follow_up?: string;
  created_at?: string;
  customer_interests?: Array<{
    id: number;
    category: {
      id: number;
      name: string;
    } | null;
    product: {
      id: number;
      name: string;
    } | null;
    revenue: number;
    notes?: string;
  }>;
}

interface PipelineStage {
  name: string;
  value: string;
  color: string;
  count: number;
  value_sum: number;
}

export default function SalesPipelineStagePage() {
  const router = useRouter();
  const params = useParams();
  const stageValue = params.stage as string;
  
  const [customers, setCustomers] = useState<CustomerInStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageInfo, setStageInfo] = useState<PipelineStage | null>(null);
  
  // Stage transition states
  const [showStageTransitionModal, setShowStageTransitionModal] = useState(false);
  const [selectedCustomerForTransition, setSelectedCustomerForTransition] = useState<CustomerInStage | null>(null);
  const [newStage, setNewStage] = useState<string>('');
  const [transitionLoading, setTransitionLoading] = useState(false);
  
  // Customer profile modal states
  const [showCustomerProfileModal, setShowCustomerProfileModal] = useState(false);
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerInStage | null>(null);

  const pipelineStages = [
    { name: 'Exhibition', value: 'exhibition', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Social Media', value: 'social_media', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Interested', value: 'interested', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { name: 'Store - Walkin', value: 'store_walkin', color: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'Negotiation', value: 'negotiation', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { name: 'Closed Won', value: 'closed_won', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { name: 'Closed Lost', value: 'closed_lost', color: 'bg-red-100 text-red-800 border-red-200' },
    { name: 'Future Prospect', value: 'future_prospect', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { name: 'Not Qualified', value: 'not_qualified', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ];

  useEffect(() => {
    if (stageValue) {
      fetchCustomersInStage();
      const stage = pipelineStages.find(s => s.value === stageValue);
      if (stage) {
        setStageInfo({
          ...stage,
          count: 0,
          value_sum: 0
        });
      }
    }
  }, [stageValue]);

  // Debug: Log customer profile data when modal opens
  useEffect(() => {
    if (selectedCustomerProfile) {
      console.log('=== FRONTEND DEBUG: Modal Product Interests ===');
      console.log('selectedCustomerProfile:', selectedCustomerProfile);
      console.log('customer_interests:', selectedCustomerProfile.customer_interests);
      console.log('customer_interests type:', typeof selectedCustomerProfile.customer_interests);
      console.log('customer_interests length:', Array.isArray(selectedCustomerProfile.customer_interests) ? selectedCustomerProfile.customer_interests.length : 'Not an array');
    }
  }, [selectedCustomerProfile]);

  const fetchCustomersInStage = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSalesPipeline({ stage: stageValue });
      
      if (response.success) {
        const pipelineData = response.data;
        let dataArray: any[] = [];
        
        if (Array.isArray(pipelineData)) {
          dataArray = pipelineData;
        } else if (pipelineData && typeof pipelineData === 'object') {
          const data = pipelineData as any;
          if (Array.isArray(data.results)) {
            dataArray = data.results;
          } else if (Array.isArray(data.data)) {
            dataArray = data.data;
          } else if (data.items && Array.isArray(data.items)) {
            dataArray = data.items;
          }
        }
        
        const customersData = dataArray.map((pipeline: any) => {
          const expectedValue = parseFloat(pipeline.expected_value) || 0;
          
          // Debug: Log the pipeline data to see what's being received
          console.log('=== FRONTEND DEBUG: Pipeline data ===');
          console.log('Pipeline:', pipeline);
          console.log('Client:', pipeline.client);
          console.log('Customer interests:', pipeline.client?.customer_interests);
          console.log('Customer interests type:', typeof pipeline.client?.customer_interests);
          console.log('Customer interests length:', Array.isArray(pipeline.client?.customer_interests) ? pipeline.client?.customer_interests.length : 'Not an array');
          
          return {
            id: pipeline.client?.id || 0,
            first_name: pipeline.client?.first_name || '',
            last_name: pipeline.client?.last_name || '',
            full_name: pipeline.client?.full_name || `${pipeline.client?.first_name || ''} ${pipeline.client?.last_name || ''}`.trim(),
            email: pipeline.client?.email || '',
            phone: pipeline.client?.phone || '',
            customer_type: pipeline.client?.customer_type || '',
            pipeline_stage: pipeline.stage || '',
            expected_value: expectedValue,
            probability: parseInt(pipeline.probability) || 0,
            assigned_to: pipeline.sales_representative || null,
            sales_representative: pipeline.sales_representative ? {
              id: pipeline.sales_representative.id || 0,
              username: pipeline.sales_representative.username || '',
              full_name: pipeline.sales_representative.full_name || '',
              store_name: pipeline.sales_representative.store_name || 'Store info not available'
            } : undefined,
            preferred_metal: pipeline.preferred_metal || '',
            preferred_stone: pipeline.preferred_stone || '',
            budget_range: pipeline.budget_range || '',
            lead_source: pipeline.lead_source || '',
            next_follow_up: pipeline.next_follow_up || '',
            created_at: pipeline.created_at || '',
            customer_interests: pipeline.client?.customer_interests || [],
          };
        });
        
        setCustomers(customersData);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers in stage:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStageTransition = (customer: CustomerInStage) => {
    setSelectedCustomerForTransition(customer);
    setNewStage(customer.pipeline_stage);
    setShowStageTransitionModal(true);
  };

  const handleCustomerProfileClick = (customer: CustomerInStage) => {
    // Debug: Log the customer data being passed to the modal
    console.log('=== FRONTEND DEBUG: Customer Profile Click ===');
    console.log('Customer:', customer);
    console.log('Customer interests:', customer.customer_interests);
    console.log('Customer interests type:', typeof customer.customer_interests);
    console.log('Customer interests length:', Array.isArray(customer.customer_interests) ? customer.customer_interests.length : 'Not an array');
    
    setSelectedCustomerProfile(customer);
    setShowCustomerProfileModal(true);
  };

  const handleUpdateStage = async () => {
    if (!selectedCustomerForTransition || !newStage) return;
    
    setTransitionLoading(true);
    try {
      // Find the pipeline ID for this customer
      const response = await apiService.getSalesPipeline({ stage: selectedCustomerForTransition.pipeline_stage });
      
      if (response.success) {
        const pipelineData = response.data;
        const dataArray = Array.isArray(pipelineData) ? pipelineData : 
                         (pipelineData as any)?.results ? (pipelineData as any).results : 
                         (pipelineData as any)?.data ? (pipelineData as any).data : [];
        
        const pipeline = dataArray.find((p: any) => p.client?.id === selectedCustomerForTransition.id);
        
        if (pipeline) {
          // Update the pipeline stage
          const updateResponse = await apiService.updatePipelineStage(pipeline.id.toString(), { stage: newStage });
          
          if (updateResponse.success) {
            // Show success message with updated counts
            const oldStageName = pipelineStages.find(s => s.value === selectedCustomerForTransition.pipeline_stage)?.name;
            const newStageName = pipelineStages.find(s => s.value === newStage)?.name;
            alert(`Successfully moved ${selectedCustomerForTransition.full_name} from ${oldStageName} to ${newStageName} stage`);
            
            // Update local state immediately for dynamic UI update
            const updatedCustomers = customers.filter(customer => customer.id !== selectedCustomerForTransition.id);
            setCustomers(updatedCustomers);
            
            setShowStageTransitionModal(false);
            setSelectedCustomerForTransition(null);
            setNewStage('');
            
            // Refresh data to ensure consistency
            setTimeout(() => {
              fetchCustomersInStage();
            }, 1000);
          } else {
            alert('Failed to update pipeline stage. Please try again.');
          }
        } else {
          alert('Could not find pipeline data for this customer.');
        }
      } else {
        alert('Failed to fetch pipeline data. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update pipeline stage:', error);
      alert('An error occurred while updating the pipeline stage. Please try again.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const totalValue = customers.reduce((sum, customer) => {
    const value = customer.expected_value || 0;
    return sum + value;
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {stageInfo?.name || 'Pipeline Stage'} Customers
          </h1>
          <p className="text-text-secondary mt-1">
            View and manage customers in this pipeline stage
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Average Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0 ? formatCurrency(totalValue / customers.length) : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchCustomersInStage}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </Button>
        <Badge variant="outline" className={stageInfo?.color}>
          {stageInfo?.name}
        </Badge>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                {searchTerm ? 'No customers found matching your search' : 'No customers in this stage'}
              </div>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold w-[25%]">Customer (Click to view profile)</TableHead>
                    <TableHead className="font-semibold w-[30%]">Sales Representative</TableHead>
                    <TableHead className="font-semibold w-[30%]">Pipeline Info</TableHead>
                    <TableHead className="font-semibold w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleCustomerProfileClick(customer)}
                    >
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="font-medium truncate">{customer.full_name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {customer.customer_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium truncate">
                            {customer.sales_representative?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            @{customer.sales_representative?.username || 'Unknown'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(customer.expected_value || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customer.probability || 0}% probability
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                          title="Move to Different Stage"
                          onClick={() => handleStageTransition(customer)}
                        >
                          <Target className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Profile Modal */}
      <Dialog open={showCustomerProfileModal} onOpenChange={setShowCustomerProfileModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl font-bold">
                  {selectedCustomerProfile?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedCustomerProfile?.full_name}
                </div>
                <div className="text-sm text-gray-500 font-normal">
                  Customer ID: {selectedCustomerProfile?.id}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomerProfile && (
            <div className="space-y-6 py-4">
              {/* Main Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Customer Details Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow min-h-[200px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-semibold">👤</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Type</span>
                      <span className="text-sm text-gray-900 capitalize">{selectedCustomerProfile.customer_type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Email</span>
                      <span className="text-sm text-gray-900 break-all max-w-[120px] truncate">{selectedCustomerProfile.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Phone</span>
                      <span className="text-sm text-gray-900">{selectedCustomerProfile.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Info Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow min-h-[200px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-semibold">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Pipeline Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Stage</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full capitalize">
                        {pipelineStages.find(s => s.value === selectedCustomerProfile.pipeline_stage)?.name || selectedCustomerProfile.pipeline_stage}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Value</span>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(selectedCustomerProfile.expected_value || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Probability</span>
                      <span className="text-sm font-semibold text-blue-600">{selectedCustomerProfile.probability || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Sales Rep Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow min-h-[200px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-sm font-semibold">👨‍💼</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Sales Representative</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Name</span>
                      <span className="text-sm text-gray-900 max-w-[120px] truncate">{selectedCustomerProfile.sales_representative?.full_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Username</span>
                      <span className="text-sm text-gray-900">@{selectedCustomerProfile.sales_representative?.username || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Interests Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-semibold">💎</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Product Interests</h3>
                  <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {selectedCustomerProfile.customer_interests?.length || 0} items
                  </span>
                </div>
                
                {selectedCustomerProfile.customer_interests && selectedCustomerProfile.customer_interests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCustomerProfile.customer_interests.map((interest, index) => (
                      <div key={interest.id || index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow min-h-[140px]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                            </span>
                            <span className="text-sm font-medium text-gray-700">Interest #{index + 1}</span>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            ₹{interest.revenue?.toLocaleString() || '0'}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category:</span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded max-w-[100px] truncate">{interest.category?.name || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product:</span>
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded max-w-[100px] truncate">{interest.product?.name || 'Not specified'}</span>
                          </div>
                        </div>
                        
                        {interest.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Notes:</span>
                            <span className="text-sm text-gray-700 italic break-words">{interest.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-400 text-2xl">💎</span>
                    </div>
                    <p className="text-gray-500 text-sm">No product interests specified</p>
                    <p className="text-gray-400 text-xs mt-1">Customer hasn't shown interest in any products yet</p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-semibold">📅</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Additional Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Next Follow-up</span>
                    <span className="text-sm text-gray-900">{selectedCustomerProfile.next_follow_up || 'Not scheduled'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Created Date</span>
                    <span className="text-sm text-gray-900">{selectedCustomerProfile.created_at ? new Date(selectedCustomerProfile.created_at).toLocaleDateString() : 'Not available'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomerProfileModal(false)}
                  className="px-6 py-2"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowCustomerProfileModal(false);
                    if (selectedCustomerProfile) {
                      handleStageTransition(selectedCustomerProfile);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Move to Different Stage
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stage Transition Modal */}
      <Dialog open={showStageTransitionModal} onOpenChange={setShowStageTransitionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Customer to Different Stage</DialogTitle>
          </DialogHeader>
          {selectedCustomerForTransition && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {selectedCustomerForTransition.full_name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Stage</label>
                <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {pipelineStages.find(s => s.value === selectedCustomerForTransition.pipeline_stage)?.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {pipelineStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowStageTransitionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateStage}
                  disabled={transitionLoading || newStage === selectedCustomerForTransition.pipeline_stage}
                >
                  {transitionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    'Move Customer'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
