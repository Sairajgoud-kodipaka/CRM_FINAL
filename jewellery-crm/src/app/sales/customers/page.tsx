'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { TrashModal } from '@/components/customers/TrashModal';
import { apiService, Client } from '@/lib/api-service';
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Archive } from 'lucide-react';
import { useScopedVisibility } from '@/lib/scoped-visibility';
import { useAuth } from '@/hooks/useAuth';
import { formatCustomerName } from '@/utils/name-utils';
import ScopeIndicator from '@/components/ui/ScopeIndicator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { DateRange } from 'react-day-picker';
import { getCurrentMonthDateRange, formatDateRange, toUtcStartOfDay, toUtcEndOfDay } from '@/lib/date-utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

export default function SalesCustomersPage() {
  const { userScope } = useScopedVisibility();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => getCurrentMonthDateRange());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Check if user can delete customers (only business admin)
  const canDeleteCustomers = user?.role === 'business_admin';

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);


      const response = await apiService.getClients({
        start_date: toUtcStartOfDay(dateRange?.from),
        end_date: toUtcEndOfDay(dateRange?.to),
      });


      const customersData = Array.isArray(response.data) ? response.data : [];

      setCustomers(customersData);
      setSelectedIds(new Set());
       
       
    } catch (error) {


      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try again.",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [userScope.type, toast, dateRange]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, dateRange]);

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
    setPage(1); // reset to first page when filters change
  }, [customers, searchTerm, statusFilter, showMyDataOnly, user?.id]);

  // Client-side pagination slice
  const total = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  // Optimistic update for customer creation
  const handleCustomerCreated = useCallback((newCustomer: Client) => {

    setModalOpen(false);

    // Optimistically add the new customer to the list
    setCustomers(prev => {

      const updated = [newCustomer, ...prev];

      return updated;
    });

    toast({
      title: "Success!",
      description: "Customer created successfully!",
      variant: "success",
    });

    // Don't call fetchCustomers() immediately - it hits cache and overwrites optimistic update
    // The optimistic update should be sufficient for immediate UI update

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

        toast({
          title: "Success!",
          description: "Customer permanently deleted from database!",
          variant: "success",
        });
      } else {


        // Revert optimistic update on failure
        fetchCustomers();

        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {


      // Revert optimistic update on error
      fetchCustomers();

      // Handle specific permission errors
      if (error.message && error.message.includes('You do not have permission to delete customers')) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to delete customers. Only business admins can delete customers.",
          variant: "destructive",
        });
      } else if (error.message && error.message.includes('Only business admins can delete customers')) {
        toast({
          title: "Permission Denied",
          description: "Only business admins can delete customers. Please contact your business administrator.",
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
        onDelete={canDeleteCustomers ? handleDeleteCustomer : undefined}
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
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              placeholder="Filter by date range"
            />
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

      {/* Date Filter Indicator */}
      <Card className="shadow-sm border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Current Date Filter</p>
                      <p className="text-sm font-bold text-blue-800">
                        {formatDateRange(
                          dateRange?.from && dateRange?.to
                            ? { from: dateRange.from, to: dateRange.to }
                            : undefined
                        )}
                      </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">📅</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="text-sm text-text-secondary">Selected {selectedIds.size} customer(s)</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await apiService.exportCustomers({ format: 'csv', fields: [] });
                      const blob = res.data as unknown as Blob;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'customers.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {}
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
                {canDeleteCustomers && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${selectedIds.size} selected customer(s)? This cannot be undone.`)) return;
                      for (const id of Array.from(selectedIds)) {
                        await apiService.deleteClient(String(id));
                      }
                      setSelectedIds(new Set());
                      fetchCustomers();
                      toast({ title: 'Deleted', description: 'Selected customers deleted', variant: 'success' });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Bulk Delete
                  </Button>
                )}
              </div>
            </div>
          )}
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === pagedCustomers.length}
                    onCheckedChange={(val) => {
                      if (val) {
                        setSelectedIds(new Set(pagedCustomers.map(c => c.id as number)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    aria-label="Select all"
                  />
                </th>
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
              {pagedCustomers.length > 0 ? (
                pagedCustomers.map((customer) => {
                  // Check if this customer belongs to the current user
                  const isCurrentUserCustomer = customer.created_by?.id === user?.id;
                  const checked = selectedIds.has((customer.id as number));

                  return (
                    <tr
                      key={customer.id}
                      className={`border-t border-border hover:bg-gray-50 ${
                        isCurrentUserCustomer ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                       {/* Select */}
                       <td className="px-4 py-3">
                         <Checkbox
                           checked={checked}
                           onCheckedChange={(val) => {
                             setSelectedIds(prev => {
                               const copy = new Set(prev);
                               if (val) copy.add(customer.id as number); else copy.delete(customer.id as number);
                               return copy;
                             });
                           }}
                         />
                       </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <span>{formatCustomerName(customer)}</span>
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
                            {`${customer.created_by.first_name || ''} ${customer.created_by.last_name || ''}`.trim() || customer.created_by.username || 'Unknown'}
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
                              <Skeleton className="w-4 h-4 mr-1 rounded" />
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
                                <Skeleton className="w-4 h-4 mr-1 rounded" />
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
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-text-secondary text-lg font-medium">
                        {customers.length === 0 
                          ? 'No customers found' 
                          : 'No customers match your filters'}
                      </div>
                      {(searchTerm || statusFilter || showMyDataOnly || dateRange) && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Active filters:</div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {searchTerm && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Search: "{searchTerm}"
                              </span>
                            )}
                            {statusFilter && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Status: {statusFilter}
                              </span>
                            )}
                            {showMyDataOnly && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                My Data Only
                              </span>
                            )}
                            {dateRange && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Date Range: {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('');
                              setShowMyDataOnly(false);
                              // Clear date range if needed
                            }}
                            className="mt-2"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 py-3 text-sm text-text-secondary">
            <div>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} customers
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value) || 20); setPage(1); }}
              >
                {[10,20,50,100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <span className="px-2">{page}/{totalPages}</span>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Mobile Floating Action Button */}
      {isMobile && !modalOpen && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            size="lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
