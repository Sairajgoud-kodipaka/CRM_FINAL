'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Download, Upload, Plus, MoreHorizontal, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Edit, Archive } from 'lucide-react';
import { apiService, Client, Store } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { formatCustomerName } from '@/utils/name-utils';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { ImportModal } from '@/components/customers/ImportModal';
import { ExportModal } from '@/components/customers/ExportModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { TrashModal } from '@/components/customers/TrashModal';
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { getCurrentMonthDateRange, formatDateRange } from '@/lib/date-utils';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { DateRange } from 'react-day-picker';
import { SALES_STAGE_LABELS } from '@/constants';
import { cn } from '@/lib/utils';

function CustomersPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  // Phone search modal logic
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [phoneSearchError, setPhoneSearchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  // Client-side pagination for mobile
  const [mobilePage, setMobilePage] = useState(1);
  const [mobilePageSize] = useState(20);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => getCurrentMonthDateRange());
  const [filterType, setFilterType] = useState<'date_range' | 'all_customers'>('date_range');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [stores, setStores] = useState<Store[]>([]);
  
  // Column header filters and sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [nameHeaderFilter, setNameHeaderFilter] = useState<string>('all');
  const [contactHeaderFilter, setContactHeaderFilter] = useState<string>('all');
  const [statusHeaderFilter, setStatusHeaderFilter] = useState<string>('all');
  const [sourceHeaderFilter, setSourceHeaderFilter] = useState<string>('all');
  const [createdByHeaderFilter, setCreatedByHeaderFilter] = useState<string>('all');
  const [createdDateHeaderFilter, setCreatedDateHeaderFilter] = useState<string>('all');
  const [storeHeaderFilter, setStoreHeaderFilter] = useState<string>('all');

  // Check if user can delete customers (only business admin)
  const canDeleteCustomers = user?.role === 'business_admin';

  // Real-time updates
  useCustomerRealtimeUpdates(
    () => {

      fetchClients();
    },
    (customerId) => {

      // If the detail modal is open for this customer, refresh it
      if (selectedCustomerId === customerId && showDetailModal) {
        // The CustomerDetailModal will handle its own refresh via the custom event
      }
    }
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(async () => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 when search changes

      // If searchTerm looks like a phone number (at least 8 digits), check if it exists
      const phone = searchTerm.trim();
      if (/^\+?\d{8,}$/.test(phone)) {
        setPhoneSearchLoading(true);
        setPhoneSearchError(null);
        try {
          const response = await apiService.checkPhoneExists(phone);
          if (response.success && response.data?.exists && response.data.customer?.id) {
            // Open detail modal for found customer
            setSelectedCustomerId(response.data.customer.id.toString());
            setShowDetailModal(true);
          } else if (response.success && !response.data?.exists) {
            // Open add modal, prefill phone
            setShowAddModal(true);
            // Optionally, you could pass phone to AddCustomerModal via context or prop
          }
        } catch (err) {
          setPhoneSearchError('Error searching phone.');
        } finally {
          setPhoneSearchLoading(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateRange, filterType, storeFilter]);

  useEffect(() => {
    fetchClients();
  }, [currentPage, debouncedSearchTerm, statusFilter, dateRange, filterType, storeFilter]);

  useEffect(() => {
    fetchStores();
  }, []);

  // Open customer detail modal from notification link (?open=customerId)
  useEffect(() => {
    const openId = searchParams?.get('open');
    if (openId && openId.trim()) {
      setSelectedCustomerId(openId.trim());
      setShowDetailModal(true);
    }
  }, [searchParams]);

  const fetchStores = async () => {
    try {
      const response = await apiService.getStores();
      if (response.success) {
        const data = response.data as any;
        setStores(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      setStores([]);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);

      // When "All Customers" is selected, fetch ALL customers from ALL stores
      if (filterType === 'all_customers') {
        const requestParams: any = {
          status: statusFilter === 'all' ? undefined : statusFilter,
          // Don't filter by store when "All Customers" - get customers from ALL stores
          store: storeFilter === 'all' ? undefined : storeFilter,
        };

        // Add search parameter if search term exists
        if (debouncedSearchTerm.trim()) {
          requestParams.search = debouncedSearchTerm.trim();
        }

        // CRITICAL: Don't send page parameter - backend returns ALL customers when page is not provided
        // According to backend code: if page is not provided, it returns all results
        const response = await apiService.getClients(requestParams);

        if (response.success) {
          const data = response.data as any;
          
          // Backend returns array directly when page parameter is not sent
          // If we get exactly 50 results, backend might still be paginating, so fetch more pages
          if (Array.isArray(data)) {
            let allClients: Client[] = [...data];
            
            // If we got exactly 50 results, backend might be defaulting to pagination
            // Fetch remaining pages until we get less than 50 results
            if (data.length === 50) {
              let currentPage = 2;
              let hasMorePages = true;
              
              // Fetch all remaining pages in batches
              const batchSize = 10;
              while (hasMorePages) {
                const batchEnd = currentPage + batchSize - 1;
                const pagePromises = [];
                
                for (let page = currentPage; page <= batchEnd; page++) {
                  const pageParams = { ...requestParams, page };
                  pagePromises.push(apiService.getClients(pageParams));
                }

                const pageResponses = await Promise.all(pagePromises);
                let foundAnyResults = false;
                
                for (const pageResponse of pageResponses) {
                  if (pageResponse.success) {
                    const pageData = pageResponse.data as any;
                    let pageResults: Client[] = [];
                    
                    if (Array.isArray(pageData)) {
                      pageResults = pageData;
                    } else if (pageData && typeof pageData === 'object' && 'results' in pageData) {
                      pageResults = Array.isArray(pageData.results) ? pageData.results : [];
                    }
                    
                    if (pageResults.length > 0) {
                      allClients.push(...pageResults);
                      foundAnyResults = true;
                      
                      // If we got less than 50 results, we've reached the end
                      if (pageResults.length < 50) {
                        hasMorePages = false;
                        break;
                      }
                    } else {
                      // No results means we've reached the end
                      hasMorePages = false;
                      break;
                    }
                  }
                }
                
                // If no results found, stop
                if (!foundAnyResults) {
                  hasMorePages = false;
                }
                
                currentPage = batchEnd + 1;
                
                // Safety check - don't fetch more than 20 pages (1000 customers)
                if (currentPage > 20) {
                  hasMorePages = false;
                }
              }
            }
            
            // Set all customers and use actual fetched count
            setClients(allClients);
            setTotalCount(allClients.length); // This will be 426 (or whatever we fetched)
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          } else if (data && typeof data === 'object' && 'results' in data) {
            // Paginated response format (if backend returns this)
            const firstPageResults = Array.isArray(data.results) ? data.results : [];
            const allClients: Client[] = [...firstPageResults];
            const apiTotalCount = data.count || 0;
            const totalPages = data.total_pages || (apiTotalCount > 0 ? Math.ceil(apiTotalCount / 50) : 1);

            // Fetch all remaining pages
            if (totalPages > 1 || (firstPageResults.length === 50 && apiTotalCount > firstPageResults.length)) {
              const actualTotalPages = totalPages > 1 ? totalPages : Math.ceil(apiTotalCount / 50);
              
              const batchSize = 10;
              for (let batchStart = 2; batchStart <= actualTotalPages; batchStart += batchSize) {
                const batchEnd = Math.min(batchStart + batchSize - 1, actualTotalPages);
                const pagePromises = [];
                
                for (let page = batchStart; page <= batchEnd; page++) {
                  const pageParams = { ...requestParams, page };
                  pagePromises.push(apiService.getClients(pageParams));
                }

                const pageResponses = await Promise.all(pagePromises);
                
                for (const pageResponse of pageResponses) {
                  if (pageResponse.success) {
                    const pageData = pageResponse.data as any;
                    if (pageData && typeof pageData === 'object' && 'results' in pageData) {
                      allClients.push(...(Array.isArray(pageData.results) ? pageData.results : []));
                    } else if (Array.isArray(pageData)) {
                      allClients.push(...pageData);
                    }
                  }
                }
              }
            }

            const finalCount = apiTotalCount > 0 ? apiTotalCount : allClients.length;
            setClients(allClients);
            setTotalCount(finalCount);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          } else {
            setClients([]);
            setTotalCount(0);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          }
        } else {
          setClients([]);
          setTotalCount(0);
          setTotalPages(1);
          setHasNext(false);
          setHasPrevious(false);
        }
      } else {
        // Date range filter - use pagination
        const requestParams: any = {
          page: currentPage,
          status: statusFilter === 'all' ? undefined : statusFilter,
          store: storeFilter === 'all' ? undefined : storeFilter,
        };

        // Add search parameter if search term exists
        if (debouncedSearchTerm.trim()) {
          requestParams.search = debouncedSearchTerm.trim();
        }

        requestParams.start_date = dateRange?.from?.toISOString();
        requestParams.end_date = dateRange?.to?.toISOString();

        const response = await apiService.getClients(requestParams);

        if (response.success) {
          const data = response.data as any;
          
          // Handle paginated response
          if (data && typeof data === 'object' && 'results' in data) {
            setClients(Array.isArray(data.results) ? data.results : []);
            // Always use API's count value - this is the actual total from backend
            setTotalCount(data.count || 0);
            setTotalPages(data.total_pages || Math.ceil((data.count || 0) / 50) || 1);
            setHasNext(!!data.next);
            setHasPrevious(!!data.previous);
          } else if (Array.isArray(data)) {
            // Fallback for non-paginated response
            setClients(data);
            setTotalCount(data.length);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          } else {
            setClients([]);
            setTotalCount(0);
            setTotalPages(1);
            setHasNext(false);
            setHasPrevious(false);
          }
        }
      }
    } catch (error) {
      // Fallback to empty array if API fails
      setClients([]);
      setTotalCount(0);
      setTotalPages(1);
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData: any) => {
    try {
      const response = await apiService.createClient(customerData);
      if (response.success) {
        setShowAddModal(false);
        // Real-time updates will automatically refresh the list

      }
    } catch (error) {

    }
  };

  const handleImportSuccess = () => {
    fetchClients(); // Refresh the list after import
  };

  const handleExportSuccess = () => {
    // Export doesn't need to refresh the list
  };

  const formatPipelineStage = (stage: string | undefined) => {
    if (!stage) return 'Unknown';
    
    // Use SALES_STAGE_LABELS if available, otherwise convert snake_case to Title Case
    if (SALES_STAGE_LABELS[stage as keyof typeof SALES_STAGE_LABELS]) {
      return SALES_STAGE_LABELS[stage as keyof typeof SALES_STAGE_LABELS];
    }
    
    // Convert snake_case to Title Case
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get unique values for column filters
  const getUniqueNames = () => {
    const names = new Set<string>();
    clients.forEach(client => {
      const name = formatCustomerName(client);
      if (name && name.trim()) {
        names.add(name);
      }
    });
    return Array.from(names).sort();
  };

  const getUniquePhoneNumbers = () => {
    const phones = new Set<string>();
    clients.forEach(client => {
      if (client.phone && client.phone.trim()) {
        phones.add(client.phone);
      }
    });
    return Array.from(phones).sort();
  };

  const getUniqueStatuses = () => {
    const statuses = new Set<string>();
    clients.forEach(client => {
      // Use pipeline_stage if available, otherwise fall back to status
      const statusValue = client.pipeline_stage || client.status;
      if (statusValue) {
        statuses.add(statusValue);
      }
    });
    return Array.from(statuses).sort();
  };

  const getUniqueSources = () => {
    const sources = new Set<string>();
    clients.forEach(client => {
      if (client.lead_source) {
        sources.add(client.lead_source);
      }
    });
    return Array.from(sources).sort();
  };

  /** Display name for "Assigned To" column: assigned salesperson, else creator, else System */
  const getAssignedToDisplayName = (client: Client): string => {
    const u = client.assigned_to_user || client.created_by;
    if (u) return `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Unknown';
    return 'System';
  };

  /** Unique users for Assigned To filter: one entry per user id (no duplicates, no comma-separated pairs) */
  const getUniqueAssignedTo = (): { id: number; displayName: string }[] => {
    const byId = new Map<number, string>();
    const SYSTEM_ID = 0;
    clients.forEach((client) => {
      const u = client.assigned_to_user || client.created_by;
      const displayName = getAssignedToDisplayName(client);
      const id = u?.id ?? SYSTEM_ID;
      if (!byId.has(id)) byId.set(id, displayName);
    });
    return Array.from(byId.entries())
      .map(([id, displayName]) => ({ id, displayName }))
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' }));
  };

  const getUniqueCreatedDates = () => {
    const dates = new Set<string>();
    clients.forEach(client => {
      if (client.created_at) {
        const date = new Date(client.created_at);
        if (!isNaN(date.getTime())) {
          const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          dates.add(monthYear);
        }
      }
    });
    return Array.from(dates).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime(); // Sort newest first
    });
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
  };

  // Apply filters and sorting to clients
  const getFilteredAndSortedClients = () => {
    let filtered = [...clients];

    // Apply name filter
    if (nameHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        const name = formatCustomerName(client);
        return name === nameHeaderFilter;
      });
    }

    // Apply contact/phone filter
    if (contactHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        return client.phone === contactHeaderFilter;
      });
    }

    // Apply status filter (use pipeline_stage if available, otherwise status)
    if (statusHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        const statusValue = client.pipeline_stage || client.status;
        return statusValue === statusHeaderFilter;
      });
    }

    // Apply source filter
    if (sourceHeaderFilter !== 'all') {
      filtered = filtered.filter(client => client.lead_source === sourceHeaderFilter);
    }

    // Apply assigned to filter
    if (createdByHeaderFilter !== 'all') {
      filtered = filtered.filter(client => getAssignedToDisplayName(client) === createdByHeaderFilter);
    }

    // Apply created date filter
    if (createdDateHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        if (!client.created_at) return false;
        const date = new Date(client.created_at);
        if (isNaN(date.getTime())) return false;
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        return monthYear === createdDateHeaderFilter;
      });
    }

    // Apply store filter
    if (storeHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        const storeId = client.store?.toString() || client.store_name;
        return storeId === storeHeaderFilter || client.store_name === storeHeaderFilter;
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'name':
            aValue = formatCustomerName(a).toLowerCase();
            bValue = formatCustomerName(b).toLowerCase();
            break;
          case 'contact':
            aValue = (a.email || a.phone || '').toLowerCase();
            bValue = (b.email || b.phone || '').toLowerCase();
            break;
          case 'status':
            aValue = (a.status || '').toLowerCase();
            bValue = (b.status || '').toLowerCase();
            break;
          case 'source':
            aValue = (a.lead_source || '').toLowerCase();
            bValue = (b.lead_source || '').toLowerCase();
            break;
          case 'created_by':
            aValue = getAssignedToDisplayName(a).toLowerCase();
            bValue = getAssignedToDisplayName(b).toLowerCase();
            break;
          case 'created':
            aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
            bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          case 'store':
            aValue = (a.store_name || a.store?.toString() || '').toLowerCase();
            bValue = (b.store_name || b.store?.toString() || '').toLowerCase();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  // Check if any header filters are active
  const hasActiveHeaderFilters = nameHeaderFilter !== 'all' || contactHeaderFilter !== 'all' || statusHeaderFilter !== 'all' || sourceHeaderFilter !== 'all' || createdByHeaderFilter !== 'all' || createdDateHeaderFilter !== 'all' || storeHeaderFilter !== 'all';

  // Clear all header filters
  const clearHeaderFilters = () => {
    setNameHeaderFilter('all');
    setContactHeaderFilter('all');
    setStatusHeaderFilter('all');
    setSourceHeaderFilter('all');
    setCreatedByHeaderFilter('all');
    setCreatedDateHeaderFilter('all');
    setStoreHeaderFilter('all');
  };

  // Define columns for ResponsiveTable
  const getCustomerColumns = (): ResponsiveColumn<Client>[] => {
    const columns: ResponsiveColumn<Client>[] = [
    {
      key: 'name',
      title: 'Name',
      priority: 'high',
      mobileLabel: 'Name',
      render: (value, row) => {
        const client = row as Client;
        return (
          <div>
            <div className="font-medium text-text-primary">
              {formatCustomerName(client)}
            </div>
            {client.preferred_metal && (
              <div className="text-sm text-text-secondary">
                Prefers: {client.preferred_metal}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'contact',
      title: 'Contact',
      priority: 'high',
      mobileLabel: 'Contact',
      render: (value, row) => {
        const client = row as Client;
        return (
          <div>
            <div className="text-text-primary">{client.email || 'N/A'}</div>
            <div className="text-sm text-text-secondary">{client.phone || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      priority: 'high',
      mobileLabel: 'Status',
      render: (value, row) => {
        const client = row as Client;
        return (
          <Badge variant={getStatusBadgeVariant(client.pipeline_stage || client.status)}>
            {client.pipeline_stage
              ? (SALES_STAGE_LABELS[client.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || formatPipelineStage(client.pipeline_stage))
              : client.status
                ? client.status.charAt(0).toUpperCase() + client.status.slice(1)
                : 'Unknown'
            }
          </Badge>
        );
      },
    },
    {
      key: 'lead_source',
      title: 'Source',
      priority: 'medium',
      mobileLabel: 'Source',
      render: (value) => (
        <span className="text-text-secondary">{value as string || 'N/A'}</span>
      ),
    },
    {
      key: 'created_by',
      title: 'Assigned To',
      priority: 'medium',
      mobileLabel: 'Assigned To',
      render: (value, row) => (
        <span className="text-text-secondary">{getAssignedToDisplayName(row as Client)}</span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      priority: 'low',
      mobileLabel: 'Created',
      render: (value) => (
        <span className="text-text-secondary">{formatDate(value as string)}</span>
      ),
    },
    ];
    
    // Add store column only for business admin
    if (user?.role === 'business_admin') {
      columns.push({
        key: 'store',
        title: 'Store',
        priority: 'medium',
        mobileLabel: 'Store',
        render: (value, row) => {
          const client = row as Client;
          return (
            <span className="text-text-secondary">
              {client.store_name || (client.store ? `Store #${client.store}` : 'N/A')}
            </span>
          );
        },
      });
    }
    
    return columns;
  };

  const handleViewCustomer = (client: Client) => {
    // Open customer detail modal
    setSelectedCustomerId(client.id.toString());
    setShowDetailModal(true);
  };

  const handleEditCustomer = (client: Client) => {
    setSelectedCustomer(client);
    setShowDetailModal(false);
    setEditModalOpen(true);
  };

  const handleCustomerUpdated = () => {
    setEditModalOpen(false);
    setSelectedCustomer(null);
    fetchClients();
  };

  const handleCustomerRestored = () => {
    fetchClients();
  };

  const handleDeleteCustomer = async (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}?`)) {
      try {
        await apiService.deleteClient(client.id.toString());
        fetchClients(); // Refresh the list
      } catch (error: any) {


        // Handle specific permission errors
        if (error.message && error.message.includes('You do not have permission to delete customers')) {
          alert('You do not have permission to delete customers. Only business admins can delete customers.');
        } else if (error.message && error.message.includes('Only business admins can delete customers')) {
          alert('Only business admins can delete customers. Please contact your business administrator.');
        } else {
          alert('Failed to delete customer. Please try again.');
        }
      }
    }
  };

  // Client-side pagination for mobile
  const filteredClients = getFilteredAndSortedClients();
  const mobileTotal = filteredClients.length;
  const mobileTotalPages = Math.max(1, Math.ceil(mobileTotal / mobilePageSize));
  const mobilePagedClients = filteredClients.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize);

  // Reset mobile page when filters change
  useEffect(() => {
    setMobilePage(1);
  }, [searchTerm, statusFilter, dateRange, filterType, storeFilter, nameHeaderFilter, contactHeaderFilter, statusHeaderFilter, sourceHeaderFilter, createdByHeaderFilter, createdDateHeaderFilter, storeHeaderFilter]);

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Customers</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">Manage your customer relationships and interactions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTrashModalOpen(true)} className="text-orange-600">
                  <Archive className="w-4 h-4 mr-2" />
                  Trash
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                onClick={() => setTrashModalOpen(true)}
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">Trash</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsExportModalOpen(true)}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Customers</p>
                <p className="text-2xl font-bold text-text-primary">{totalCount || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Customers</p>
                <p className="text-2xl font-bold text-text-primary">
                  {clients.filter(c => c.status === 'customer').length || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">New This Month</p>
                <p className="text-2xl font-bold text-text-primary">
                  {clients.filter(c => {
                    if (!c.created_at) return false;
                    const created = new Date(c.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-semibold">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Leads</p>
                <p className="text-2xl font-bold text-text-primary">
                  {clients.filter(c => c.status === 'lead').length || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-semibold">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="shadow-sm border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-blue-800">Date Range Filter:</span>
              <span className="text-xs sm:text-sm text-blue-600">
                {filterType === 'all_customers' ? 'All Customers' : (dateRange?.from && dateRange?.to ? formatDateRange({ from: dateRange.from, to: dateRange.to }) : 'No date selected')}
              </span>
            </div>
            <DateRangeFilter
              dateRange={filterType === 'all_customers' ? undefined : dateRange}
              onDateRangeChange={(newDateRange) => {
                if (newDateRange) {
                  setDateRange(newDateRange)
                  setFilterType('date_range')
                }
              }}
              showAllCustomers={false}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
                type="text"
                inputMode="search"
                autoComplete="off"
              />
              {/* Show phone search loading/error */}
              {phoneSearchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600">Checking...</div>
              )}
              {phoneSearchError && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-red-600">{phoneSearchError}</div>
              )}
            </div>
            <Button
              variant={filterType === 'all_customers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (filterType === 'all_customers') {
                  // Turn off: reset to current month
                  setDateRange(getCurrentMonthDateRange())
                  setFilterType('date_range')
                } else {
                  // Turn on: show all customers
                  setFilterType('all_customers')
                }
                setCurrentPage(1); // Reset to page 1 when toggling
              }}
              className={`${filterType === 'all_customers' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''} w-full sm:w-auto`}
            >
              All Customers
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="By store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
            {/* Pagination Controls at Top-Right - Only show for date range filter */}
            {!loading && clients.length > 0 && filterType === 'date_range' && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrevious || currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={!hasNext || currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-secondary">Loading customers...</div>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-text-secondary mb-2">No customers found</div>
              <Button onClick={() => setShowAddModal(true)} variant="outline">
                Add your first customer
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              {isMobile ? (
                <>
                  {/* Clear Filters Button */}
                  {hasActiveHeaderFilters && (
                    <div className="flex items-center justify-end mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHeaderFilters}
                        className="text-xs"
                      >
                        Clear Header Filters
                      </Button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {mobilePagedClients.length > 0 ? (
                      mobilePagedClients.map((client) => {
                        const isCurrentUserCustomer = (client.assigned_to_user?.id ?? client.created_by?.id) === user?.id;
                        return (
                          <Card
                            key={client.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all hover:shadow-md",
                              isCurrentUserCustomer ? 'border-l-4 border-l-orange-500 bg-orange-50' : ''
                            )}
                            onClick={() => handleViewCustomer(client)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-base text-text-primary truncate">
                                    {formatCustomerName(client)}
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
                                    <span className="text-text-primary">{client.phone || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-text-secondary font-medium">Status:</span>
                                    <Badge variant={getStatusBadgeVariant(client.pipeline_stage || client.status)} className="capitalize text-xs">
                                      {client.pipeline_stage
                                        ? (SALES_STAGE_LABELS[client.pipeline_stage as keyof typeof SALES_STAGE_LABELS] || formatPipelineStage(client.pipeline_stage))
                                        : client.status
                                          ? client.status.charAt(0).toUpperCase() + client.status.slice(1)
                                          : 'Unknown'
                                      }
                                    </Badge>
                                  </div>
                                  {client.lead_source && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-text-secondary font-medium">Source:</span>
                                      <span className="text-text-primary">{client.lead_source}</span>
                                    </div>
                                  )}
                                  {client.store_name && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-text-secondary font-medium">Store:</span>
                                      <span className="text-text-primary">{client.store_name}</span>
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
                                    handleViewCustomer(client);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {canDeleteCustomers && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomer(client);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-text-secondary text-lg font-medium">
                          {clients.length === 0 
                            ? 'No customers found' 
                            : 'No customers match your filters'}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Mobile Pagination - Inside Card, at bottom */}
                  {mobileTotal > 0 && (
                    <div className="sticky bottom-16 bg-white border-t pt-3 pb-3 px-3 -mx-3 -mb-3 mt-4 z-10">
                      <div className="flex flex-col items-center gap-2 text-xs text-text-secondary">
                        <div className="text-center">
                          Showing {(mobilePage - 1) * mobilePageSize + 1}-{Math.min(mobilePage * mobilePageSize, mobileTotal)} of {mobileTotal}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white"
                            onClick={() => setMobilePage(p => Math.max(1, p - 1))}
                            disabled={mobilePage <= 1}
                          >
                            Prev
                          </button>
                          <span className="px-3 text-sm font-medium">{mobilePage}/{mobileTotalPages}</span>
                          <button
                            className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white"
                            onClick={() => setMobilePage(p => Math.min(mobileTotalPages, p + 1))}
                            disabled={mobilePage >= mobileTotalPages}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Clear Filters Button */}
                  {hasActiveHeaderFilters && (
                    <div className="flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearHeaderFilters}
                        className="text-xs"
                      >
                        Clear Header Filters
                      </Button>
                    </div>
                  )}
                  
                  {/* Custom Table */}
                  <div className="overflow-x-auto rounded-lg border border-border bg-white">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            NAME
                            {getSortIcon('name')}
                          </button>
                          <Select value={nameHeaderFilter} onValueChange={setNameHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Names</SelectItem>
                              {getUniqueNames().map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('contact')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            CONTACT
                            {getSortIcon('contact')}
                          </button>
                          <Select value={contactHeaderFilter} onValueChange={setContactHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Phone Numbers</SelectItem>
                              {getUniquePhoneNumbers().map((phone) => (
                                <SelectItem key={phone} value={phone}>
                                  {phone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            STATUS
                            {getSortIcon('status')}
                          </button>
                          <Select value={statusHeaderFilter} onValueChange={setStatusHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              {getUniqueStatuses().map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('source')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            SOURCE
                            {getSortIcon('source')}
                          </button>
                          <Select value={sourceHeaderFilter} onValueChange={setSourceHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sources</SelectItem>
                              {getUniqueSources().map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('created_by')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            ASSIGNED TO
                            {getSortIcon('created_by')}
                          </button>
                          <Select value={createdByHeaderFilter} onValueChange={setCreatedByHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              {getUniqueAssignedTo().map(({ id, displayName }) => (
                                <SelectItem key={id} value={displayName}>
                                  {displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleSort('created')}
                            className="flex items-center hover:text-foreground transition-colors"
                          >
                            CREATED
                            {getSortIcon('created')}
                          </button>
                          <Select value={createdDateHeaderFilter} onValueChange={setCreatedDateHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Dates</SelectItem>
                              {getUniqueCreatedDates().map((date) => (
                                <SelectItem key={date} value={date}>
                                  {date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </th>
                      {user?.role === 'business_admin' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleSort('store')}
                              className="flex items-center hover:text-foreground transition-colors"
                            >
                              STORE
                              {getSortIcon('store')}
                            </button>
                            <Select value={storeHeaderFilter} onValueChange={setStoreHeaderFilter}>
                              <SelectTrigger className="h-8 text-xs w-full">
                                <SelectValue placeholder="All" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Stores</SelectItem>
                                {stores.map((store) => (
                                  <SelectItem key={store.id} value={store.id.toString()}>
                                    {store.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </th>
                      )}
                      <th className="w-12 px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {getFilteredAndSortedClients().length === 0 ? (
                      <tr>
                        <td colSpan={user?.role === 'business_admin' ? 8 : 7} className="px-6 py-8 text-center text-text-secondary">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      getFilteredAndSortedClients().map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => handleViewCustomer(client)}
                          className="hover:bg-muted/50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-text-primary">
                                {formatCustomerName(client)}
                              </div>
                              {client.preferred_metal && (
                                <div className="text-sm text-text-secondary">
                                  Prefers: {client.preferred_metal}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-text-primary">{client.email || 'N/A'}</div>
                              <div className="text-sm text-text-secondary">{client.phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(client.pipeline_stage || client.status)}>
                              {client.pipeline_stage
                                ? formatPipelineStage(client.pipeline_stage)
                                : client.status
                                  ? client.status.charAt(0).toUpperCase() + client.status.slice(1)
                                  : 'Unknown'
                              }
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">{client.lead_source || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">
                              {getAssignedToDisplayName(client)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-text-secondary">{formatDate(client.created_at || '')}</span>
                          </td>
                          {user?.role === 'business_admin' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-text-secondary">
                                {client.store_name || (client.store ? `Store #${client.store}` : 'N/A')}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCustomer(client); }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCustomer(client); }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {canDeleteCustomers && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomer(client);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Show filtered count */}
              {getFilteredAndSortedClients().length !== clients.length && (
                <div className="text-sm text-text-secondary text-center mt-2">
                  Showing {getFilteredAndSortedClients().length} of {clients.length} customers
                </div>
              )}
                </div>
              )}
            </>
          )}
          
          {/* Pagination Controls - Only show when using date range filter */}
          {!loading && clients.length > 0 && filterType === 'date_range' && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-text-secondary">
                Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} customers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrevious || currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={!hasNext || currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Show total count when "All Customers" is selected */}
          {!loading && filterType === 'all_customers' && clients.length > 0 && (
            <div className="flex items-center justify-center mt-4 pt-4 border-t">
              <div className="text-sm text-text-secondary">
                Showing all {totalCount} customers
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCustomerCreated={() => {
            setShowAddModal(false);
            fetchClients(); // Refresh the list after customer creation
          }}
          // Optionally, pass phone as prop if you want to prefill
          // phone={searchTerm}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onSuccess={handleExportSuccess}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCustomerId(null);
          const params = new URLSearchParams(searchParams?.toString() ?? '');
          if (params.has('open')) {
            params.delete('open');
            window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
          }
        }}
        customerId={selectedCustomerId}
        onEdit={handleEditCustomer}
        onDelete={(customerId) => {
          const customerToDelete = clients.find(c => c.id.toString() === customerId);
          if (customerToDelete) {
            handleDeleteCustomer(customerToDelete);
          }
        }}
      />

      <EditCustomerModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <TrashModal
        open={trashModalOpen}
        onClose={() => setTrashModalOpen(false)}
        onCustomerRestored={handleCustomerRestored}
      />

      {/* Mobile Floating Action Button */}
      {isMobile && !showAddModal && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setShowAddModal(true)}
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

export default function CustomersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16 text-text-secondary">Loading...</div>
    }>
      <CustomersPageContent />
    </Suspense>
  );
}
