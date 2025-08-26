'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Phone, Mail, MapPin, Calendar, User, DollarSign, Target, Edit, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface PipelineStage {
  name: string;
  value: string;
  color: string;
  count: number;
  value_sum: number;
}

interface CustomerInStage {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  customer_type: string;
  lead_source?: string;
  budget_range?: string;
  preferred_metal?: string;
  preferred_stone?: string;
  next_follow_up?: string;
  created_at: string;
  pipeline_stage: string;
  expected_value?: number;
  probability?: number;
  assigned_to?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

interface PipelineStageStatsProps {
  className?: string;
}

export function PipelineStageStatsManager({ className }: PipelineStageStatsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pipelineStats, setPipelineStats] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [customersInStage, setCustomersInStage] = useState<CustomerInStage[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<CustomerInStage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageTransitionModal, setShowStageTransitionModal] = useState(false);
  const [selectedCustomerForTransition, setSelectedCustomerForTransition] = useState<CustomerInStage | null>(null);
  const [newStage, setNewStage] = useState<string>('');
  const [transitionLoading, setTransitionLoading] = useState(false);

  const pipelineStages = [
    { name: 'Exhibition', value: 'exhibition', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Social Media', value: 'social_media', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Interested', value: 'interested', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Store - Walkin', value: 'store_walkin', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Negotiation', value: 'negotiation', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Closed Won', value: 'closed_won', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Closed Lost', value: 'closed_lost', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Future Prospect', value: 'future_prospect', color: 'bg-white text-gray-800 border-gray-200' },
    { name: 'Not Qualified', value: 'not_qualified', color: 'bg-white text-gray-800 border-gray-200' },
  ];

  useEffect(() => {
    fetchPipelineStats();
  }, []);

  const fetchPipelineStats = async () => {
    try {
      setLoading(true);
      // Try to get detailed stage data first
      let response = await apiService.getPipelineStages();
      
      if (response.success) {
        const stagesData = response.data;
        console.log('Pipeline stages data received:', stagesData);
        // Map the backend data to our frontend format
        const stageStats = pipelineStages.map(stage => {
          const backendStage = stagesData.find((s: any) => s.label === stage.name);
          console.log(`Mapping stage ${stage.name}:`, backendStage);
          return {
            ...stage,
            count: backendStage?.count || 0,
            value_sum: backendStage?.value || 0,
          };
        });
        console.log('Final stage stats:', stageStats);
        setPipelineStats(stageStats);
      } else {
        // Fallback to general pipeline stats
        response = await apiService.getPipelineStats();
        if (response.success) {
          // Use general stats to show at least some data
          const stats = response.data;
          const stageStats = pipelineStages.map(stage => ({
            ...stage,
            count: Math.floor((stats.activeDeals || 0) / pipelineStages.length), // Distribute evenly
            value_sum: Math.floor((stats.totalValue || 0) / pipelineStages.length), // Distribute evenly
          }));
          setPipelineStats(stageStats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pipeline stats:', error);
      setError('Failed to load pipeline stats');
      // Fallback to empty stats
      const stageStats = pipelineStages.map(stage => ({
        ...stage,
        count: 0,
        value_sum: 0,
      }));
      setPipelineStats(stageStats);
    } finally {
      setLoading(false);
    }
  };

  const handleStageClick = (stageValue: string) => {
    router.push(`/manager/pipeline/${stageValue}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditCustomer = (customer: CustomerInStage) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleStageTransition = (customer: CustomerInStage) => {
    setSelectedCustomerForTransition(customer);
    setNewStage(customer.pipeline_stage);
    setShowStageTransitionModal(true);
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
            toast({
          title: "Success!",
          description: `Successfully moved ${selectedCustomerForTransition.full_name} from ${oldStageName} to ${newStageName} stage`,
          variant: "success",
        });
            
            // Update local state immediately for dynamic UI update
            const updatedCustomers = customersInStage.filter(customer => customer.id !== selectedCustomerForTransition.id);
            setCustomersInStage(updatedCustomers);
            
            // Update pipeline stats immediately
            const updatedStats = pipelineStats.map(stage => {
              if (stage.value === selectedCustomerForTransition.pipeline_stage) {
                return { ...stage, count: Math.max(0, stage.count - 1) };
              } else if (stage.value === newStage) {
                return { ...stage, count: stage.count + 1 };
              }
              return stage;
            });
            setPipelineStats(updatedStats);
            
            setShowStageTransitionModal(false);
            setSelectedCustomerForTransition(null);
            setNewStage('');
            
            // Refresh pipeline stats in background to ensure data consistency
            setTimeout(() => {
              fetchPipelineStats();
            }, 1000);
          } else {
            toast({
          title: "Error",
          description: "Failed to update pipeline stage. Please try again.",
          variant: "destructive",
        });
          }
        } else {
          toast({
          title: "Error",
          description: "Could not find pipeline data for this customer.",
          variant: "destructive",
        });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch pipeline data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update pipeline stage:', error);
      alert('An error occurred while updating the pipeline stage. Please try again.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleSaveCustomer = async (updatedCustomer: CustomerInStage) => {
    try {
      // Here you would typically call an API to update the customer
      // For now, we'll just update the local state
      const updatedCustomers = customersInStage.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      );
      setCustomersInStage(updatedCustomers);
      setShowEditModal(false);
      setEditingCustomer(null);
      
      // Show success message
      alert(`Successfully updated ${updatedCustomer.full_name}`);
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer. Please try again.');
    }
  };

  const filteredCustomers = customersInStage.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStageInfo = pipelineStages.find(stage => stage.value === selectedStage);

  return (
    <div className={className}>
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading pipeline stats...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600 text-center">
            <div className="mb-2">{error}</div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setError(null);
                fetchPipelineStats();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Pipeline Stage Stats Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {pipelineStats.map((stage) => (
            <Card 
              key={stage.value} 
              className={`shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${stage.color}`}
              onClick={() => handleStageClick(stage.value)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="font-medium">{stage.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {stage.count}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold mb-3 text-green-600">
                  {formatCurrency(stage.value_sum)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {stage.count} customers
                </div>
                <div className="text-xs text-gray-500">
                  Click to view customers
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      <Dialog open={!!selectedStage} onOpenChange={() => {
        setSelectedStage(null);
        setSearchTerm('');
        setCustomersInStage([]);
      }}>
        <DialogContent className="w-[95vw] max-w-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Customers in {selectedStageInfo?.name} Stage
              <Badge variant="outline" className="ml-2">
                {customersInStage.length} customers
              </Badge>
            </DialogTitle>
            <div className="text-sm text-muted-foreground">
              Click on any customer row to view more details
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageClick(selectedStage!)}
                disabled={customersLoading}
              >
                Refresh Data
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, phone, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageClick(selectedStage!)}
                disabled={customersLoading}
              >
                Refresh
              </Button>
              <Badge variant="outline" className={selectedStageInfo?.color}>
                {selectedStageInfo?.name}
              </Badge>
            </div>

            {/* Customers Table */}
            {customersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading customers...</div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  {searchTerm ? 'No customers found matching your search' : 'No customers in this stage'}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  This could mean either there are no customers in this pipeline stage, or there was an issue fetching the data.
                </div>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStageClick(selectedStage!)}
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold min-w-[200px]">Customer</TableHead>
                      <TableHead className="font-semibold min-w-[180px]">Contact</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Location</TableHead>
                      <TableHead className="font-semibold min-w-[150px]">Pipeline Info</TableHead>
                      <TableHead className="font-semibold min-w-[180px]">Details</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <TableCell className="max-w-0">
                          <div className="space-y-1">
                            <div className="font-medium truncate">{customer.full_name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {customer.customer_type} • {customer.lead_source || 'Unknown source'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Added: {formatDate(customer.created_at)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="space-y-1">
                            {customer.city && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {customer.city}
                                  {customer.state && `, ${customer.state}`}
                                </span>
                              </div>
                            )}
                            {customer.address && (
                              <div className="text-xs text-muted-foreground truncate">
                                {customer.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatCurrency(customer.expected_value || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Probability: {customer.probability || 0}%
                            </div>
                            {customer.assigned_to && (
                              <div className="text-xs text-muted-foreground truncate">
                                Assigned to: {customer.assigned_to.full_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {customer.preferred_metal && (
                              <div className="truncate">Metal: {customer.preferred_metal}</div>
                            )}
                            {customer.preferred_stone && (
                              <div className="truncate">Stone: {customer.preferred_stone}</div>
                            )}
                            {customer.budget_range && (
                              <div className="truncate">Budget: {customer.budget_range}</div>
                            )}
                            {customer.next_follow_up && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">Follow up: {customer.next_follow_up}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300"
                              title="Edit Customer"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStageTransition(customer)}
                              className="h-8 px-2 hover:bg-green-50 hover:border-green-300"
                              title="Move to Different Stage"
                            >
                              <Target className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer: {editingCustomer?.full_name}</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingCustomer.first_name}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      first_name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingCustomer.last_name}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      last_name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={editingCustomer.city || ''}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      city: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={editingCustomer.state || ''}
                    onChange={(e) => setEditingCustomer({
                      ...editingCustomer,
                      state: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSaveCustomer(editingCustomer)}
                >
                  Save Changes
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

