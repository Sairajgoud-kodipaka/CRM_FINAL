'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Download, Upload, Plus, MoreHorizontal, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { apiService, Client, Store } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { formatCustomerName } from '@/utils/name-utils';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { ImportModal } from '@/components/customers/ImportModal';
import { ExportModal } from '@/components/customers/ExportModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { getCurrentMonthDateRange, formatDateRange } from '@/lib/date-utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DateRange } from 'react-day-picker';

export default function CustomersPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
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
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 when search changes
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

  const getUniqueCreatedBy = () => {
    const creators = new Set<string>();
    clients.forEach(client => {
      if (client.created_by) {
        const name = `${client.created_by.first_name || ''} ${client.created_by.last_name || ''}`.trim() || client.created_by.username || 'Unknown';
        creators.add(name);
      } else if (client.assigned_to) {
        creators.add(`User ID: ${client.assigned_to}`);
      } else {
        creators.add('System');
      }
    });
    return Array.from(creators).sort();
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

    // Apply created by filter
    if (createdByHeaderFilter !== 'all') {
      filtered = filtered.filter(client => {
        const createdBy = client.created_by
          ? `${client.created_by.first_name || ''} ${client.created_by.last_name || ''}`.trim() || client.created_by.username || 'Unknown'
          : client.assigned_to
            ? `User ID: ${client.assigned_to}`
            : 'System';
        return createdBy === createdByHeaderFilter;
      });
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
            const aCreatedBy = a.created_by
              ? `${a.created_by.first_name || ''} ${a.created_by.last_name || ''}`.trim() || a.created_by.username || 'Unknown'
              : a.assigned_to
                ? `User ID: ${a.assigned_to}`
                : 'System';
            const bCreatedBy = b.created_by
              ? `${b.created_by.first_name || ''} ${b.created_by.last_name || ''}`.trim() || b.created_by.username || 'Unknown'
              : b.assigned_to
                ? `User ID: ${b.assigned_to}`
                : 'System';
            aValue = aCreatedBy.toLowerCase();
            bValue = bCreatedBy.toLowerCase();
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
              ? formatPipelineStage(client.pipeline_stage)
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
      title: 'Created By',
      priority: 'medium',
      mobileLabel: 'Created By',
      render: (value, row) => {
        const client = row as Client;
        const createdBy = client.created_by
          ? `${client.created_by.first_name || ''} ${client.created_by.last_name || ''}`.trim() || client.created_by.username || 'Unknown'
          : client.assigned_to
            ? `User ID: ${client.assigned_to}`
            : 'System';
        return <span className="text-text-secondary">{createdBy}</span>;
      },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Customers</h1>
          <p className="text-text-secondary mt-1">Manage your customer relationships and interactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size={isMobile ? "default" : "sm"}
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-800">Date Range Filter:</span>
              <span className="text-sm text-blue-600">
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
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
              className={filterType === 'all_customers' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              All Customers
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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
                            CREATED BY
                            {getSortIcon('created_by')}
                          </button>
                          <Select value={createdByHeaderFilter} onValueChange={setCreatedByHeaderFilter}>
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              {getUniqueCreatedBy().map((creator) => (
                                <SelectItem key={creator} value={creator}>
                                  {creator}
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
                              {client.created_by
                                ? `${client.created_by.first_name || ''} ${client.created_by.last_name || ''}`.trim() || client.created_by.username || 'Unknown'
                                : client.assigned_to
                                  ? `User ID: ${client.assigned_to}`
                                  : 'System'}
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
        }}
        customerId={selectedCustomerId}
        onEdit={(customer) => {
          // Edit functionality removed - just close the detail modal
          setShowDetailModal(false);
        }}
        onDelete={(customerId) => {
          const customerToDelete = clients.find(c => c.id.toString() === customerId);
          if (customerToDelete) {
            handleDeleteCustomer(customerToDelete);
          }
        }}
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
