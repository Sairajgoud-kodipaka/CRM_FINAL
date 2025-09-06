'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { TrashModal } from '@/components/customers/TrashModal';
import { apiService, Client } from '@/lib/api-service';
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Archive, Loader2 } from 'lucide-react';
import { useScopedVisibility } from '@/lib/scoped-visibility';
import { useAuth } from '@/hooks/useAuth';
import ScopeIndicator from '@/components/ui/ScopeIndicator';
import { useToast } from '@/hooks/use-toast';

export default function SalesCustomersPage() {
  const { userScope } = useScopedVisibility();
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState<string | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMyDataOnly, setShowMyDataOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Client[]>([]);

  // Check if user can delete customers (managers and higher roles)
  const canDeleteCustomers = user?.role && ['platform_admin', 'business_admin', 'manager'].includes(user.role);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching customers with user scope:', userScope.type);
      
      const response = await apiService.getClients();
      console.log('Customers API response:', response);
      
      const customersData = Array.isArray(response.data) ? response.data : [];
      console.log('Processed customers data:', customersData);
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [userScope.type, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    // Filter customers based on search term, status, and my data filter
    let filtered = customers || [];
    
    // Apply "My Data" filter first
    if (showMyDataOnly) {
      filtered = filtered.filter(customer => customer.created_by?.id === user?.id);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter, showMyDataOnly, user?.id]);

  // Optimistic update for customer creation
  const handleCustomerCreated = useCallback((newCustomer: Client) => {
    console.log('🔄 handleCustomerCreated called with:', newCustomer);
    setModalOpen(false);
    
    // Optimistically add the new customer to the list
    setCustomers(prev => {
      console.log('📝 Previous customers count:', prev.length);
      const updated = [newCustomer, ...prev];
      console.log('📝 Updated customers count:', updated.length);
      return updated;
    });
    
    toast({
      title: "Success!",
      description: "Customer created successfully!",
      variant: "success",
    });
    
    // Don't call fetchCustomers() immediately - it hits cache and overwrites optimistic update
    // The optimistic update should be sufficient for immediate UI update
    console.log('✅ Customer added optimistically - no background refresh needed');
  }, [toast]);

  // Optimistic update for customer editing
  const handleCustomerUpdated = useCallback((updatedCustomer: Client) => {
    setEditModalOpen(false);
    setSelectedCustomer(null);
    
    // Optimistically update the customer in the list
    setCustomers(prev => prev.map(customer => 
      customer.id?.toString() === updatedCustomer.id?.toString() ? updatedCustomer : customer
    ));
    
    toast({
      title: "Success!",
      description: "Customer updated successfully!",
      variant: "success",
    });
    
    // Refresh data in background to ensure consistency
    fetchCustomers();
  }, [fetchCustomers, toast]);

  // Optimistic update for customer deletion
  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    try {
      setDeletingCustomer(customerId);
      
      // Optimistically remove the customer from the list
      setCustomers(prev => prev.filter(customer => customer.id?.toString() !== customerId));
      
      const response = await apiService.deleteClient(customerId);
      
      if (response.success) {
        console.log('Customer deleted successfully');
        toast({
          title: "Success!",
          description: "Customer moved to trash successfully!",
          variant: "success",
        });
      } else {
        console.error('Failed to delete customer:', response);
        
        // Revert optimistic update on failure
        fetchCustomers();
        
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      
      // Revert optimistic update on error
      fetchCustomers();
      
      // Handle specific permission errors
      if (error.message && error.message.includes('House sales persons cannot delete customers')) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to delete customers. Only managers can delete customers.",
          variant: "destructive",
        });
      } else if (error.message && error.message.includes('You do not have permission to delete this customer')) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to delete this customer. You can only delete customers from your own store.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setDeletingCustomer(null);
    }
  }, [fetchCustomers, toast]);

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailModalOpen(true);
  };

  const handleEditCustomer = (customer: Client) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleCustomerRestored = () => {
    fetchCustomers(); // Refresh the list after restore
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'customer':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'prospect':
        return 'outline';
      case 'inactive':
        return 'destructive';
      case 'exhibition':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const exportCustomers = async (format: 'csv' | 'json') => {
    try {
      const response = await apiService.exportCustomers({
        format,
        fields: ['first_name', 'last_name', 'email', 'phone', 'status', 'created_at']
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `Customers exported as ${format.toUpperCase()} successfully!`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error exporting customers:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export customers. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
            <p className="text-text-secondary mt-1">Find and manage your assigned customers</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
              <AddCustomerModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      <CustomerDetailModal 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)}
        customerId={selectedCustomerId}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />
      <EditCustomerModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />
      <TrashModal 
        open={trashModalOpen} 
        onClose={() => setTrashModalOpen(false)}
        onCustomerRestored={handleCustomerRestored}
      />
      
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
            <p className="text-text-secondary mt-1">Find and manage your assigned customers</p>
            <div className="mt-2">
              <ScopeIndicator showDetails={false} />
            </div>
            {/* Summary stats */}
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Total Customers:</span>
                <span className="font-semibold text-text-primary">{customers.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">My Customers:</span>
                <span className="font-semibold text-orange-600">
                  {customers.filter(customer => customer.created_by?.id === user?.id).length}
                </span>
              </div>
            </div>
            {/* My Data Filter Button */}
            <div className="mt-3">
              <Button
                variant={showMyDataOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMyDataOnly(!showMyDataOnly)}
                className={showMyDataOnly ? "bg-orange-600 hover:bg-orange-700" : "border-orange-600 text-orange-600 hover:bg-orange-50"}
              >
                {showMyDataOnly ? "Show All Customers" : "My Data"}
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setTrashModalOpen(true)}
              className="text-orange-600 hover:text-orange-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Trash
            </Button>
            <Button className="btn-primary" size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCustomers('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCustomers('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by name, email, or phone..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Created By</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  // Check if this customer belongs to the current user
                  const isCurrentUserCustomer = customer.created_by?.id === user?.id;
                  
                  return (
                    <tr 
                      key={customer.id} 
                      className={`border-t border-border hover:bg-gray-50 ${
                        isCurrentUserCustomer ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <span>{customer.first_name} {customer.last_name}</span>
                          {isCurrentUserCustomer && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                              My Customer
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{customer.email}</td>
                      <td className="px-4 py-3 text-text-primary">{customer.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(customer.status || '')} className="capitalize text-xs">
                          {customer.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {customer.created_by ? (
                          <span className={isCurrentUserCustomer ? 'font-semibold text-orange-600' : ''}>
                            {customer.created_by.first_name} {customer.created_by.last_name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {customer.created_at ? formatDate(customer.created_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleViewCustomer(customer.id.toString())}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handleEditCustomer(customer)}
                            disabled={updatingCustomer === customer.id?.toString()}
                          >
                                                          {updatingCustomer === customer.id?.toString() ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Edit className="w-4 h-4 mr-1" />
                            )}
                            {updatingCustomer === customer.id.toString() ? 'Updating...' : 'Edit'}
                          </Button>
                          {canDeleteCustomers && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to move ${customer.first_name} ${customer.last_name} to trash? You can restore them later from the Trash section.`)) {
                                  handleDeleteCustomer(customer.id.toString());
                                }
                              }}
                              disabled={deletingCustomer === customer.id?.toString()}
                            >
                              {deletingCustomer === customer.id?.toString() ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                              )}
                              {deletingCustomer === customer.id.toString() ? 'Moving...' : 'Move to Trash'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    {customers.length === 0 ? 'No customers found' : 'No customers match your search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length > 0 && (
          <div className="text-sm text-text-secondary text-center py-2">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </Card>
    </div>
  );
}