'use client';
import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { TrashModal } from '@/components/customers/TrashModal';
import { ExportModal } from '@/components/customers/ExportModal';
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
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { SALES_STAGE_LABELS } from '@/constants';
import { cn } from '@/lib/utils';

function SalesCustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userScope } = useScopedVisibility();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => getCurrentMonthDateRange());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const hasHandledActionRef = useRef(false);

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

      // The backend uses DRF PageNumberPagination, so response.data may be
      // a paginated envelope { count, next, previous, results: [...] }
      // OR a plain array (fallback). Handle both cases.
      let customersData: Client[] = [];
      if (response.success) {
        const raw = response.data as any;
        if (Array.isArray(raw)) {
          customersData = raw;
        } else if (raw && typeof raw === 'object' && Array.isArray(raw.results)) {
          customersData = raw.results;
        }
      }

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

  // Listen for customer detail updates (e.g., stage changes)
  useEffect(() => {
    const handleRefresh = async (event: CustomEvent) => {
      if (event.detail?.customerId) {
        const { customerId, newStage } = event.detail;

        // Optimistically update the customer in the list immediately
        if (customerId && newStage) {
          setCustomers(prevCustomers =>
            prevCustomers.map(customer =>
              customer.id?.toString() === customerId.toString()
                ? { ...customer, pipeline_stage: newStage, status: newStage }
                : customer
            )
          );

          // Also update filtered customers if they exist
          setFilteredCustomers(prevFiltered =>
            prevFiltered.map(customer =>
              customer.id?.toString() === customerId.toString()
                ? { ...customer, pipeline_stage: newStage, status: newStage }
                : customer
            )
          );
        }

        // Refresh the customer list from server to ensure we have the latest data
        // Use a small delay to ensure the backend has processed the update
        // Add timestamp to bypass cache
        setTimeout(async () => {
          try {
            const response = await apiService.getClients({
              start_date: toUtcStartOfDay(dateRange?.from),
              end_date: toUtcEndOfDay(dateRange?.to),
            } as any);

            if (response.success) {
              const raw = response.data as any;
              let customersData: Client[] = [];
              if (Array.isArray(raw)) {
                customersData = raw;
              } else if (raw && typeof raw === 'object' && Array.isArray(raw.results)) {
                customersData = raw.results;
              }
              setCustomers(customersData);
              setSelectedIds(new Set());
            }
          } catch (error) {
            console.error('Error refreshing customers:', error);
            // Even if refresh fails, optimistic update is already applied
          }
        }, 500);
      }
    };

    window.addEventListener('refreshCustomerDetails', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('refreshCustomerDetails', handleRefresh as EventListener);
    };
  }, [dateRange]);

  useEffect(() => {
    const action = searchParams?.get('action');
    if (action === 'addCustomer' && !hasHandledActionRef.current) {
      hasHandledActionRef.current = true;
      setModalOpen(true);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('action');
        const queryString = params.toString();
        const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
        window.history.replaceState(null, '', newUrl);
      }
    } else if (!action) {
      hasHandledActionRef.current = false;
    }
  }, [searchParams]);

  // Open customer detail modal from notification link (?open=customerId)
  useEffect(() => {
    const openId = searchParams?.get('open');
    if (openId?.trim()) {
      setSelectedCustomerId(openId.trim());
      setDetailModalOpen(true);
    }
  }, [searchParams]);

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
      filtered = filtered.filter(customer => {
        const statusValue = customer.pipeline_stage || customer.status;
        return statusValue === statusFilter;
      });
    }

    setFilteredCustomers(filtered);
    setPage(1); // reset to first page when filters change
  }, [customers, searchTerm, statusFilter, showMyDataOnly, user?.id]);

  useEffect(() => {
    if (isMobile && selectedIds.size > 0) {
      setSelectedIds(new Set());
    }
  }, [isMobile, selectedIds.size]);

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

    // Success feedback via push notification only (no toast)

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

    // Success feedback via push notification only (no toast)

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
        // Success feedback via push only (no toast)
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

  const handleViewCustomer = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailModalOpen(true);
  }, []);

  const handleEditCustomer = useCallback((customer: Client) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  }, []);

  const clickTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleCustomerRestored = () => {
    fetchCustomers(); // Refresh the list after restore
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatPipelineStage = (stage: string | undefined) => {
    if (!stage) return 'Unknown';

    // Convert snake_case to Title Case
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get unique statuses from pipeline_stage or status
  const getUniqueStatuses = () => {
    const statuses = new Set<string>();
    customers.forEach(customer => {
      const statusValue = customer.pipeline_stage || customer.status;
      if (statusValue) {
        statuses.add(statusValue);
      }
    });
    return Array.from(statuses).sort();
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';

    const statusLower = status.toLowerCase();

    // Handle pipeline stages
    switch (statusLower) {
      case 'exhibition':
        return 'outline';
      case 'social_media':
        return 'outline';
      case 'interested':
        return 'secondary';
      case 'store_walkin':
        return 'default';
      case 'negotiation':
        return 'default';
      case 'closed_won':
        return 'default';
      case 'closed_lost':
        return 'destructive';
      case 'future_prospect':
        return 'outline';
      case 'not_qualified':
        return 'destructive';
      // Legacy status values
      case 'customer':
        return 'default';
      case 'prospect':
        return 'secondary';
      case 'lead':
        return 'outline';
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleExportSuccess = () => {
    // Export doesn't need to refresh the list
  };

  const handleRowClick = useCallback((customer: Client) => {
    const customerId = customer.id ? customer.id.toString() : null;

    if (!customerId) {
      return;
    }

    if (isMobile) {
      const now = Date.now();
      if (now - lastTapRef.current < 250) {
        lastTapRef.current = 0;
        if (clickTimeoutRef.current) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        handleEditCustomer(customer);
        return;
      }

      lastTapRef.current = now;
    }

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      handleViewCustomer(customerId);
      clickTimeoutRef.current = null;
      lastTapRef.current = 0;
    }, 250);
  }, [handleEditCustomer, handleViewCustomer, isMobile]);

  const handleRowDoubleClick = useCallback((customer: Client) => {
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    handleEditCustomer(customer);
  }, [handleEditCustomer]);

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
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
      <AddCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      <CustomerDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCustomerId(null);
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            if (params.has('open')) {
              params.delete('open');
              const qs = params.toString();
              window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
            }
          }
        }}
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
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onSuccess={handleExportSuccess}
      />

      <div className="flex flex-col gap-4 mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Customers</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">Find and manage your assigned customers</p>
          <div className="mt-2">
            <ScopeIndicator showDetails={false} />
          </div>
          {/* Summary stats */}
          <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Total:</span>
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
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder="Filter by date range"
          />
          {/* Sales users do not need Trash */}
          <Button className="btn-primary w-full sm:w-auto" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setExportModalOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Removed: Date Filter Indicator card */}

      <Card className="p-3 sm:p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {getUniqueStatuses().map(status => (
                <option key={status} value={status}>
                  {status.includes('_') ? formatPipelineStage(status) : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <>
            <div className="space-y-3">
              {pagedCustomers.length > 0 ? (
                pagedCustomers.map((customer) => {
                  const isCurrentUserCustomer = customer.created_by?.id === user?.id;
                  return (
                    <Card
                      key={customer.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${isCurrentUserCustomer ? 'border-l-4 border-l-orange-500 bg-orange-50' : ''
                        }`}
                      onClick={() => handleRowClick(customer)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base text-text-primary truncate">
                              {formatCustomerName(customer)}
                            </h3>
                            {isCurrentUserCustomer && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs flex-shrink-0">
                                My Customer
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary font-medium">Phone:</span>
                              <span className="text-text-primary">{customer.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary font-medium">Status:</span>
                              <Badge variant={getStatusBadgeVariant(customer.pipeline_stage || customer.status)} className="capitalize text-xs">
                                {customer.pipeline_stage
                                  ? (SALES_STAGE_LABELS[customer.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || formatPipelineStage(customer.pipeline_stage))
                                  : customer.status
                                    ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
                                    : 'Unknown'
                                }
                              </Badge>
                            </div>
                            {customer.lead_source && (
                              <div className="flex items-center gap-2">
                                <span className="text-text-secondary font-medium">Source:</span>
                                <span className="text-text-primary">{customer.lead_source}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (customer.id) {
                                handleViewCustomer(customer.id.toString());
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCustomer(customer);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-text-secondary text-lg font-medium">
                    {customers.length === 0
                      ? 'No customers found'
                      : 'No customers match your filters'}
                  </div>
                </div>
              )}
            </div>
            {/* Mobile Pagination - Inside Card, at bottom */}
            {total > 0 && (
              <div className="sticky bottom-16 bg-white border-t pt-3 pb-3 px-3 -mx-3 -mb-3 mt-4 z-10">
                <div className="flex flex-col items-center gap-2 text-xs text-text-secondary">
                  <div className="text-center">
                    Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Prev
                    </button>
                    <span className="px-3 text-sm font-medium">{page}/{totalPages}</span>
                    <button
                      className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
            {!isMobile && selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                <div className="text-sm text-text-secondary">Selected {selectedIds.size} customer(s)</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportModalOpen(true)}
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
                        // Success via push only (no toast)
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
                  {!isMobile && (
                    <th className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
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
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  )}
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Customer</th>
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Phone</th>
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Status</th>
                  {!isTablet && (
                    <>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Lead Source</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Created By</th>
                      <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Created</th>
                    </>
                  )}
                  <th className="px-3 sm:px-4 py-3 text-left font-semibold text-text-secondary text-xs sm:text-sm">Actions</th>
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
                        onClick={() => handleRowClick(customer)}
                        onDoubleClick={() => handleRowDoubleClick(customer)}
                        className={`border-t border-border hover:bg-gray-50 cursor-pointer ${isCurrentUserCustomer ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                          }`}
                      >
                        {!isMobile && (
                          <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(val) => {
                                setSelectedIds(prev => {
                                  const copy = new Set(prev);
                                  if (val) copy.add(customer.id as number); else copy.delete(customer.id as number);
                                  return copy;
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td className="px-3 sm:px-4 py-3 font-medium text-text-primary text-sm">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{formatCustomerName(customer)}</span>
                            {isCurrentUserCustomer && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 text-xs flex-shrink-0">
                                My Customer
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-text-primary text-sm">{customer.phone || '-'}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <Badge variant={getStatusBadgeVariant(customer.pipeline_stage || customer.status)} className="capitalize text-xs">
                            {customer.pipeline_stage
                              ? (SALES_STAGE_LABELS[customer.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || formatPipelineStage(customer.pipeline_stage))
                              : customer.status
                                ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
                                : 'Unknown'
                            }
                          </Badge>
                        </td>
                        {!isTablet && (
                          <>
                            <td className="px-3 sm:px-4 py-3 text-text-secondary text-sm">
                              {customer.lead_source || '-'}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-text-secondary text-sm">
                              {customer.created_by ? (
                                <span className={isCurrentUserCustomer ? 'font-semibold text-orange-600' : ''}>
                                  {`${customer.created_by.first_name || ''} ${customer.created_by.last_name || ''}`.trim() || customer.created_by.username || 'Unknown'}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-text-secondary text-sm">
                              {customer.created_at ? formatDate(customer.created_at) : '-'}
                            </td>
                          </>
                        )}
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customer.id) {
                                  handleViewCustomer(customer.id.toString());
                                }
                              }}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                              disabled={updatingCustomer === customer.id?.toString()}
                              title="Edit"
                            >
                              {updatingCustomer === customer.id?.toString() ? (
                                <Skeleton className="w-4 h-4 rounded" />
                              ) : (
                                <Edit className="w-4 h-4" />
                              )}
                            </Button>
                            {canDeleteCustomers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const customerIdStr = customer.id ? customer.id.toString() : null;
                                  if (customerIdStr && window.confirm(`Are you sure you want to move ${customer.first_name} ${customer.last_name} to trash? You can restore them later from the Trash section.`)) {
                                    handleDeleteCustomer(customerIdStr);
                                  }
                                }}
                                disabled={deletingCustomer === customer.id?.toString()}
                                title="Delete"
                              >
                                {deletingCustomer === customer.id?.toString() ? (
                                  <Skeleton className="w-4 h-4 rounded" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isTablet ? 5 : 8} className="px-4 py-8 text-center">
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
        )}

        {/* Desktop/Tablet Pagination */}
        {!isMobile && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-xs sm:text-sm text-text-secondary">
            <div className="text-center sm:text-left">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} customers
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Rows per page</span>
                <select
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  value={pageSize}
                  onChange={(e) => { setPageSize(parseInt(e.target.value) || 20); setPage(1); }}
                >
                  {[10, 20, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="px-2 py-1 text-xs sm:text-sm border rounded disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </button>
                <span className="px-2 text-xs sm:text-sm">{page}/{totalPages}</span>
                <button
                  className="px-2 py-1 text-xs sm:text-sm border rounded disabled:opacity-50"
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
      {isMobile && !modalOpen && !detailModalOpen && !editModalOpen && (
        <div className="fixed bottom-20 right-4 z-30">
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

export default function SalesCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-sm text-muted-foreground">Loading customers…</div>
        </div>
      }
    >
      <SalesCustomersPageContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
