'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { ImportModal } from '@/components/customers/ImportModal';
import { ExportModal } from '@/components/customers/ExportModal';
import { apiService, Client, Store } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { formatCustomerName } from '@/utils/name-utils';
import { Search, Download, Plus, Eye, Edit, Trash2, Upload, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { DateRange } from 'react-day-picker';
import { getCurrentMonthDateRange, formatDateRange } from '@/lib/date-utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

function ManagerCustomersPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <Card className="p-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </Card>
    </div>
  );
}

function ManagerCustomersContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const canDeleteCustomers = user?.role === 'business_admin';

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchProgress, setFetchProgress] = useState<{ loaded: number; total: number } | null>(null);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => getCurrentMonthDateRange());
  const [filterType, setFilterType] = useState<'date_range' | 'all_customers'>('date_range');

  // ── Server-side pagination (date range mode) ───────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // ── Mobile client-side pagination ─────────────────────────────────────────
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 20;

  // ── Column sorting ─────────────────────────────────────────────────────────
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Column header filters ──────────────────────────────────────────────────
  const [nameHeaderFilter, setNameHeaderFilter] = useState('all');
  const [phoneHeaderFilter, setPhoneHeaderFilter] = useState('all');
  const [statusHeaderFilter, setStatusHeaderFilter] = useState('all');
  const [salespersonHeaderFilter, setSalespersonHeaderFilter] = useState('all');
  const [createdDateHeaderFilter, setCreatedDateHeaderFilter] = useState('all');
  const [storeHeaderFilter, setStoreHeaderFilter] = useState('all');

  // ── Store filter (top-bar) ─────────────────────────────────────────────────
  const [storeFilter, setStoreFilter] = useState('all');
  const [stores, setStores] = useState<Store[]>([]);

  // ── Real-time updates ──────────────────────────────────────────────────────
  useCustomerRealtimeUpdates(() => { fetchCustomers(); });

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearchTerm(searchTerm); setCurrentPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Reset page on filter changes ───────────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [filterType, dateRange, storeFilter]);

  // ── Fetch on dependency changes ────────────────────────────────────────────
  useEffect(() => { fetchCustomers(); }, [currentPage, debouncedSearchTerm, filterType, dateRange, storeFilter]);

  // ── Load stores once ───────────────────────────────────────────────────────
  useEffect(() => {
    apiService.getStores().then(res => {
      if (res.success) {
        const d = res.data as any;
        setStores(Array.isArray(d) ? d : d?.results || []);
      }
    });
  }, []);

  // ── Reset mobile page ──────────────────────────────────────────────────────
  useEffect(() => {
    setMobilePage(1);
  }, [searchTerm, filterType, dateRange, storeFilter, nameHeaderFilter, phoneHeaderFilter, statusHeaderFilter, salespersonHeaderFilter, createdDateHeaderFilter, storeHeaderFilter]);

  // ── Open customer from ?open= param ───────────────────────────────────────
  useEffect(() => {
    const openId = searchParams?.get('open');
    if (openId?.trim()) { setSelectedCustomerId(openId.trim()); setDetailModalOpen(true); }
  }, [searchParams]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setFetchProgress(null);

      if (filterType === 'all_customers') {
        const reqParams: any = {};
        if (debouncedSearchTerm.trim()) reqParams.search = debouncedSearchTerm.trim();
        // In All Customers mode: no store filter → return entire business DB
        // If a specific store is selected in the top bar, scope to that store
        if (storeFilter !== 'all') reqParams.store = storeFilter;

        const response = await apiService.getClients(reqParams);

        if (response.success) {
          const data = response.data as any;

          if (Array.isArray(data)) {
            let all: Client[] = [...data];

            if (data.length === 50) {
              setFetchProgress({ loaded: all.length, total: all.length });
              let page = 2;
              let more = true;
              const BATCH = 10;

              while (more) {
                const end = page + BATCH - 1;
                const promises = [];
                for (let p = page; p <= end; p++) promises.push(apiService.getClients({ ...reqParams, page: p }));

                const results = await Promise.all(promises);
                let foundAny = false;

                for (const res of results) {
                  if (res.success) {
                    const pd = res.data as any;
                    const batch: Client[] = Array.isArray(pd) ? pd : (Array.isArray(pd?.results) ? pd.results : []);
                    if (batch.length > 0) {
                      all.push(...batch);
                      foundAny = true;
                      if (batch.length < 50) { more = false; break; }
                    } else { more = false; break; }
                  }
                }

                if (!foundAny) more = false;
                page = end + 1;
                if (page > 20) more = false;
                setFetchProgress({ loaded: all.length, total: all.length });
              }
            }

            setCustomers(all);
            setTotalCount(all.length);
            setTotalPages(1); setHasNext(false); setHasPrevious(false);

          } else if (data && typeof data === 'object' && Array.isArray(data.results)) {
            const all: Client[] = [...data.results];
            const apiTotal: number = data.count || 0;
            const pages: number = data.total_pages || (apiTotal > 0 ? Math.ceil(apiTotal / 50) : 1);

            setFetchProgress({ loaded: all.length, total: apiTotal });

            if (pages > 1) {
              const BATCH = 10;
              for (let start = 2; start <= pages; start += BATCH) {
                const end = Math.min(start + BATCH - 1, pages);
                const promises = [];
                for (let p = start; p <= end; p++) promises.push(apiService.getClients({ ...reqParams, page: p }));
                const results = await Promise.all(promises);
                for (const res of results) {
                  if (res.success) {
                    const pd = res.data as any;
                    if (Array.isArray(pd?.results)) all.push(...pd.results);
                    else if (Array.isArray(pd)) all.push(...pd);
                  }
                }
                setFetchProgress({ loaded: all.length, total: apiTotal });
              }
            }

            setCustomers(all);
            setTotalCount(apiTotal > 0 ? apiTotal : all.length);
            setTotalPages(1); setHasNext(false); setHasPrevious(false);
          } else {
            setCustomers([]); setTotalCount(0);
          }
        } else {
          setCustomers([]); setTotalCount(0);
        }

        setFetchProgress(null);

      } else {
        const reqParams: any = { page: currentPage };
        if (debouncedSearchTerm.trim()) reqParams.search = debouncedSearchTerm.trim();
        if (storeFilter !== 'all') reqParams.store = storeFilter;
        if (dateRange?.from) reqParams.start_date = dateRange.from.toISOString();
        if (dateRange?.to) reqParams.end_date = dateRange.to.toISOString();

        const response = await apiService.getClients(reqParams);

        if (response.success) {
          const data = response.data as any;
          if (data && typeof data === 'object' && Array.isArray(data.results)) {
            setCustomers(data.results);
            setTotalCount(data.count || 0);
            setTotalPages(data.total_pages || Math.ceil((data.count || 0) / 50) || 1);
            setHasNext(!!data.next);
            setHasPrevious(!!data.previous);
          } else if (Array.isArray(data)) {
            setCustomers(data); setTotalCount(data.length);
            setTotalPages(1); setHasNext(false); setHasPrevious(false);
          } else {
            setCustomers([]); setTotalCount(0);
            setTotalPages(1); setHasNext(false); setHasPrevious(false);
          }
        }
      }
    } catch {
      setCustomers([]); setTotalCount(0); setFetchProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  const formatPipelineStage = (stage: string | undefined) => {
    if (!stage) return 'Unknown';
    return stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const getSalespersonName = (c: Client) => {
    if (c.created_by) return `${c.created_by.first_name || ''} ${c.created_by.last_name || ''}`.trim() || c.created_by.username || 'Unknown';
    return 'Unknown';
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline' as const;
    switch (status.toLowerCase()) {
      case 'closed_won': case 'store_walkin': case 'negotiation': case 'customer': return 'default' as const;
      case 'interested': case 'prospect': return 'secondary' as const;
      case 'closed_lost': case 'not_qualified': case 'inactive': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const getStatusBadgeClasses = (status: string | undefined) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'exhibition': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social_media': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interested': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'store_walkin': case 'closed_won': case 'customer': return 'bg-green-100 text-green-800 border-green-200';
      case 'negotiation': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed_lost': case 'not_qualified': case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'future_prospect': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospect': return 'bg-amber-100 text-amber-900 border-amber-200';
      default: return '';
    }
  };

  // ── Unique values for column filters ──────────────────────────────────────
  const getUniqueNames = () => {
    const s = new Set<string>();
    customers.forEach(c => { const n = formatCustomerName(c); if (n?.trim()) s.add(n); });
    return Array.from(s).sort();
  };

  const getUniquePhones = () => {
    const s = new Set<string>();
    customers.forEach(c => { if (c.phone?.trim()) s.add(c.phone); });
    return Array.from(s).sort();
  };

  const getUniqueStatuses = () => {
    const s = new Set<string>();
    customers.forEach(c => { const v = c.pipeline_stage || c.status; if (v) s.add(v); });
    return Array.from(s).sort();
  };

  const getUniqueSalespersons = () => {
    const s = new Set<string>();
    customers.forEach(c => s.add(getSalespersonName(c)));
    return Array.from(s).sort();
  };

  const getUniqueCreatedDates = () => {
    const s = new Set<string>();
    customers.forEach(c => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        if (!isNaN(d.getTime())) s.add(d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }));
      }
    });
    return Array.from(s).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const getUniqueStoreNames = () => {
    const s = new Set<string>();
    customers.forEach(c => { const n = c.store_name || (c.store ? `Store #${c.store}` : null); if (n) s.add(n); });
    return Array.from(s).sort();
  };

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const getSortIcon = (col: string) => {
    if (sortColumn !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const getFilteredAndSortedCustomers = () => {
    let list = [...customers];

    if (nameHeaderFilter !== 'all') list = list.filter(c => formatCustomerName(c) === nameHeaderFilter);
    if (phoneHeaderFilter !== 'all') list = list.filter(c => c.phone === phoneHeaderFilter);
    if (statusHeaderFilter !== 'all') list = list.filter(c => (c.pipeline_stage || c.status) === statusHeaderFilter);
    if (salespersonHeaderFilter !== 'all') list = list.filter(c => getSalespersonName(c) === salespersonHeaderFilter);
    if (createdDateHeaderFilter !== 'all') {
      list = list.filter(c => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        return !isNaN(d.getTime()) && d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) === createdDateHeaderFilter;
      });
    }
    if (storeHeaderFilter !== 'all') {
      list = list.filter(c => (c.store_name || (c.store ? `Store #${c.store}` : '')) === storeHeaderFilter);
    }

    if (sortColumn) {
      list.sort((a, b) => {
        let av: any, bv: any;
        switch (sortColumn) {
          case 'name': av = formatCustomerName(a).toLowerCase(); bv = formatCustomerName(b).toLowerCase(); break;
          case 'phone': av = (a.phone || '').toLowerCase(); bv = (b.phone || '').toLowerCase(); break;
          case 'status': av = (a.pipeline_stage || a.status || '').toLowerCase(); bv = (b.pipeline_stage || b.status || '').toLowerCase(); break;
          case 'salesperson': av = getSalespersonName(a).toLowerCase(); bv = getSalespersonName(b).toLowerCase(); break;
          case 'created': av = a.created_at ? new Date(a.created_at).getTime() : 0; bv = b.created_at ? new Date(b.created_at).getTime() : 0; break;
          case 'store': av = (a.store_name || '').toLowerCase(); bv = (b.store_name || '').toLowerCase(); break;
          default: return 0;
        }
        if (av < bv) return sortDirection === 'asc' ? -1 : 1;
        if (av > bv) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  };

  const hasActiveHeaderFilters = nameHeaderFilter !== 'all' || phoneHeaderFilter !== 'all' || statusHeaderFilter !== 'all' || salespersonHeaderFilter !== 'all' || createdDateHeaderFilter !== 'all' || storeHeaderFilter !== 'all';

  const clearHeaderFilters = () => {
    setNameHeaderFilter('all'); setPhoneHeaderFilter('all');
    setStatusHeaderFilter('all'); setSalespersonHeaderFilter('all');
    setCreatedDateHeaderFilter('all'); setStoreHeaderFilter('all');
  };

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleViewCustomer = (id: string) => { setSelectedCustomerId(id); setDetailModalOpen(true); };
  const handleEditCustomer = (c: Client) => { setSelectedCustomer(c); setEditModalOpen(true); };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await apiService.deleteClient(id);
      if (res.success) { fetchCustomers(); }
      else alert('Failed to delete customer. Please try again.');
    } catch (e: any) {
      if (e.message?.includes('permission') || e.message?.includes('Only business admins')) alert('Only business admins can delete customers.');
      else alert('Failed to delete customer. Please try again.');
    }
  };

  const handleCustomerUpdated = () => { setEditModalOpen(false); setSelectedCustomer(null); fetchCustomers(); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredCustomers = getFilteredAndSortedCustomers();
  const mobileTotal = filteredCustomers.length;
  const mobileTotalPages = Math.max(1, Math.ceil(mobileTotal / mobilePageSize));
  const mobilePagedCustomers = filteredCustomers.slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize);

  const statsThisMonth = customers.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      {/* Modals */}
      <AddCustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); fetchCustomers(); }}
        onCustomerCreated={() => fetchCustomers()}
      />
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => { setImportModalOpen(false); fetchCustomers(); }}
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
              window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
            }
          }
        }}
        customerId={selectedCustomerId}
        onEdit={handleEditCustomer}
        onDelete={canDeleteCustomers ? handleDeleteCustomer : undefined}
      />
      <EditCustomerModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedCustomer(null); }}
        customer={selectedCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />
      <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onSuccess={() => {}} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Customers</h1>
          <p className="text-sm text-text-secondary mt-1">View and manage your store's customers</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportModalOpen(true)}><Upload className="w-4 h-4 mr-2" />Import</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportModalOpen(true)}><Download className="w-4 h-4 mr-2" />Export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="flex items-center gap-2">
                <Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)} className="flex items-center gap-2">
                <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
              </Button>
            </>
          )}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-text-secondary">Total Customers</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{totalCount || customers.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-text-secondary">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{customers.filter(c => c.status === 'customer' || c.pipeline_stage === 'closed_won').length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-text-secondary">New This Month</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{statsThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-text-secondary">Leads</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{customers.filter(c => c.status === 'lead').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date filter bar */}
      <Card className="shadow-sm border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-blue-800">Date Range:</span>
              <span className="text-xs sm:text-sm text-blue-600">
                {filterType === 'all_customers' ? 'All Customers' : (dateRange?.from && dateRange?.to ? formatDateRange({ from: dateRange.from, to: dateRange.to }) : 'No date selected')}
              </span>
            </div>
            <DateRangeFilter
              dateRange={filterType === 'all_customers' ? undefined : dateRange}
              onDateRangeChange={(newDateRange) => { if (newDateRange) { setDateRange(newDateRange); setFilterType('date_range'); } }}
              showAllCustomers={false}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search + toggle */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={filterType === 'all_customers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (filterType === 'all_customers') { setDateRange(getCurrentMonthDateRange()); setFilterType('date_range'); }
                else setFilterType('all_customers');
                setCurrentPage(1);
              }}
              className={`${filterType === 'all_customers' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''} w-full sm:w-auto`}
            >
              All Customers
            </Button>
            <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44 text-sm"><SelectValue placeholder="All Stores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Customers
            </CardTitle>
            {!loading && customers.length > 0 && filterType === 'date_range' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={!hasPrevious || currentPage === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={!hasNext || currentPage >= totalPages}>Next</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-text-secondary">
              {fetchProgress ? `Loading ${fetchProgress.loaded} customers…` : 'Loading customers…'}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-2">No customers found</p>
              <Button onClick={() => setModalOpen(true)} variant="outline">Add your first customer</Button>
            </div>
          ) : (
            <>
              {isMobile ? (
                /* Mobile card view */
                <>
                  {hasActiveHeaderFilters && (
                    <div className="flex justify-end mb-3">
                      <Button variant="outline" size="sm" onClick={clearHeaderFilters} className="text-xs">Clear Filters</Button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {mobilePagedCustomers.length > 0 ? mobilePagedCustomers.map(c => (
                      <Card key={c.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => handleViewCustomer(c.id.toString())}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{formatCustomerName(c)}</h3>
                            <div className="space-y-1 text-sm mt-1">
                              <div className="flex gap-2"><span className="text-text-secondary">Phone:</span><span>{c.phone || '-'}</span></div>
                              <div className="flex gap-2 items-center">
                                <span className="text-text-secondary">Status:</span>
                                <Badge variant={getStatusBadgeVariant(c.pipeline_stage || c.status)} className={`capitalize text-xs ${getStatusBadgeClasses(c.pipeline_stage || c.status)}`}>
                                  {c.pipeline_stage ? formatPipelineStage(c.pipeline_stage) : c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Unknown'}
                                </Badge>
                              </div>
                              <div className="flex gap-2"><span className="text-text-secondary">Salesperson:</span><span>{getSalespersonName(c)}</span></div>
                              {(c.store_name || c.store) && (
                                <div className="flex gap-2"><span className="text-text-secondary">Store:</span><span>{c.store_name || `Store #${c.store}`}</span></div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => { e.stopPropagation(); handleViewCustomer(c.id.toString()); }}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600" onClick={e => { e.stopPropagation(); handleEditCustomer(c); }}><Edit className="w-4 h-4" /></Button>
                            {canDeleteCustomers && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={e => { e.stopPropagation(); if (window.confirm(`Move ${c.first_name} ${c.last_name} to trash?`)) handleDeleteCustomer(c.id.toString()); }}><Trash2 className="w-4 h-4" /></Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )) : (
                      <div className="text-center py-8 text-text-secondary">No customers match your filters</div>
                    )}
                  </div>
                  {mobileTotal > 0 && (
                    <div className="sticky bottom-16 bg-white border-t pt-3 pb-3 px-3 -mx-3 -mb-3 mt-4 z-10">
                      <div className="flex flex-col items-center gap-2 text-xs text-text-secondary">
                        <span>Showing {(mobilePage - 1) * mobilePageSize + 1}–{Math.min(mobilePage * mobilePageSize, mobileTotal)} of {mobileTotal}</span>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white" onClick={() => setMobilePage(p => Math.max(1, p - 1))} disabled={mobilePage <= 1}>Prev</button>
                          <span className="px-2 font-medium">{mobilePage}/{mobileTotalPages}</span>
                          <button className="px-3 py-1.5 text-sm border rounded disabled:opacity-50 bg-white" onClick={() => setMobilePage(p => Math.min(mobileTotalPages, p + 1))} disabled={mobilePage >= mobileTotalPages}>Next</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Desktop table */
                <div className="space-y-3">
                  {hasActiveHeaderFilters && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={clearHeaderFilters} className="text-xs">Clear Header Filters</Button>
                    </div>
                  )}
                  <div className="overflow-x-auto rounded-lg border border-border bg-white">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('name')} className="flex items-center hover:text-foreground transition-colors">NAME {getSortIcon('name')}</button>
                              <Select value={nameHeaderFilter} onValueChange={setNameHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Names</SelectItem>
                                  {getUniqueNames().map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('phone')} className="flex items-center hover:text-foreground transition-colors">PHONE {getSortIcon('phone')}</button>
                              <Select value={phoneHeaderFilter} onValueChange={setPhoneHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Phone Numbers</SelectItem>
                                  {getUniquePhones().map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('salesperson')} className="flex items-center hover:text-foreground transition-colors">SALESPERSON {getSortIcon('salesperson')}</button>
                              <Select value={salespersonHeaderFilter} onValueChange={setSalespersonHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {getUniqueSalespersons().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('status')} className="flex items-center hover:text-foreground transition-colors">STATUS {getSortIcon('status')}</button>
                              <Select value={statusHeaderFilter} onValueChange={setStatusHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {getUniqueStatuses().map(s => <SelectItem key={s} value={s}>{formatPipelineStage(s)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('created')} className="flex items-center hover:text-foreground transition-colors">CREATED {getSortIcon('created')}</button>
                              <Select value={createdDateHeaderFilter} onValueChange={setCreatedDateHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Dates</SelectItem>
                                  {getUniqueCreatedDates().map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="flex flex-col gap-2">
                              <button onClick={() => handleSort('store')} className="flex items-center hover:text-foreground transition-colors">STORE {getSortIcon('store')}</button>
                              <Select value={storeHeaderFilter} onValueChange={setStoreHeaderFilter}>
                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Stores</SelectItem>
                                  {getUniqueStoreNames().map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                          <th className="w-10 px-4 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {filteredCustomers.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No customers match your filters</td></tr>
                        ) : filteredCustomers.map(c => (
                          <tr key={c.id} onClick={() => handleViewCustomer(c.id.toString())} className="hover:bg-muted/50 cursor-pointer">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-text-primary">{formatCustomerName(c)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-text-primary">{c.phone || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{getSalespersonName(c)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant={getStatusBadgeVariant(c.pipeline_stage || c.status)} className={`capitalize text-xs font-semibold ${getStatusBadgeClasses(c.pipeline_stage || c.status)}`}>
                                {c.pipeline_stage ? formatPipelineStage(c.pipeline_stage) : c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Unknown'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{formatDate(c.created_at || '')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{c.store_name || (c.store ? `Store #${c.store}` : '-')}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewCustomer(c.id.toString())}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditCustomer(c)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                                  {canDeleteCustomers && (
                                    <DropdownMenuItem className="text-red-600" onClick={() => { if (window.confirm(`Move ${c.first_name} ${c.last_name} to trash?`)) handleDeleteCustomer(c.id.toString()); }}>
                                      <Trash2 className="w-4 h-4 mr-2" />Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredCustomers.length !== customers.length && (
                    <div className="text-sm text-text-secondary text-center mt-2">
                      Showing {filteredCustomers.length} of {customers.length} customers
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Pagination footer — date range mode */}
          {!loading && customers.length > 0 && filterType === 'date_range' && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-text-secondary">
                Showing {((currentPage - 1) * 50) + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount} customers
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={!hasPrevious || currentPage === 1}>Previous</Button>
                <span className="text-sm text-text-secondary">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={!hasNext || currentPage >= totalPages}>Next</Button>
              </div>
            </div>
          )}

          {/* All customers footer */}
          {!loading && filterType === 'all_customers' && customers.length > 0 && (
            <div className="flex items-center justify-center mt-4 pt-4 border-t text-sm text-text-secondary">
              Showing all {totalCount} customers
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile FAB */}
      {isMobile && !modalOpen && !detailModalOpen && !editModalOpen && (
        <div className="fixed bottom-20 right-4 z-30">
          <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center" size="lg">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ManagerCustomersPage() {
  return (
    <Suspense fallback={<ManagerCustomersPageSkeleton />}>
      <ManagerCustomersContent />
    </Suspense>
  );
}
