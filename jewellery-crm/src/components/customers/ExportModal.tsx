// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
// @ts-ignore - TypeScript configuration: lucide-react types should be available
import { Download, FileText, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { SALES_STAGE_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

// Local DateRange type definition (matching react-day-picker structure)
interface DateRange {
  from?: Date;
  to?: Date;
}

interface Store {
  id: number;
  name: string;
  code?: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface Exhibition {
  id: number;
  name: string;
  date?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExportModal({ isOpen, onClose, onSuccess }: ExportModalProps) {
  const { user } = useAuth();
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'first_name',
    'last_name',
    'email',
    'phone',
    'status',
    'lead_source',
    'created_by',
    'created_at'
  ]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [exhibitionFilter, setExhibitionFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  // Data for filters
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Only fields that exist in Add Customer Modal
  const availableFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'full_address', label: 'Full Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'reason_for_visit', label: 'Reason for Visit' },
    { key: 'status', label: 'Status' },
    { key: 'lead_source', label: 'Lead Source' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'customer_type', label: 'Customer Type' },
    { key: 'summary_notes', label: 'Summary Notes' },
    { key: 'created_by', label: 'Created By / Salesperson' },
    { key: 'created_at', label: 'Created Date' }
  ];

  // Fetch filter data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFilterData();
    } else {
      // Reset filters when modal closes
      setSearchTerm('');
      setStatusFilter('all');
      setStoreFilter('all');
      setLeadSourceFilter('all');
      setCreatedByFilter('all');
      setExhibitionFilter('all');
      setProductFilter('all');
      setExportDateRange(undefined);
    }
  }, [isOpen]);

  // Auto-select store for managers when stores are loaded
  useEffect(() => {
    if (isOpen && user && user.role === 'manager' && user.store && stores.length > 0) {
      const userStore = stores.find(store => store.id === user.store);
      if (userStore && storeFilter === 'all') {
        setStoreFilter(userStore.id.toString());
      }
    }
  }, [stores, isOpen, user, storeFilter]);

  const fetchFilterData = async () => {
    try {
      setLoadingFilters(true);
      // Fetch stores
      const storesResponse = await apiService.getStores();
      if (storesResponse.success && storesResponse.data) {
        const storesData = Array.isArray(storesResponse.data)
          ? storesResponse.data
          : (storesResponse.data as any).results || [];
        setStores(storesData);
      }

      // Fetch users (salespersons)
      try {
        const response = await apiService.getAllSalesUsers();
        if (response.success && response.data) {
          let usersList = [];
          if (Array.isArray(response.data)) {
            usersList = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (Array.isArray(response.data.users)) {
              usersList = response.data.users;
            } else if (Array.isArray(response.data.data)) {
              usersList = response.data.data;
            } else if (Array.isArray(response.data.results)) {
              usersList = response.data.results;
            }
          }
          const mappedUsers = usersList.map((user: any) => ({
            id: user.id,
            username: user.username || user.name || '',
            first_name: user.first_name || (user.name ? user.name.split(' ')[0] : ''),
            last_name: user.last_name || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
          }));
          setUsers(mappedUsers);
        } else {
          console.warn('Failed to fetch users:', response.message);
          setUsers([]); // Set empty array on failure
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setUsers([]); // Set empty array on error
      }

      // Fetch exhibitions
      try {
        const exhibitionsResponse = await apiService.getExhibitions();
        if (exhibitionsResponse.success && exhibitionsResponse.data) {
          const exhibitionsData = Array.isArray(exhibitionsResponse.data)
            ? exhibitionsResponse.data
            : (exhibitionsResponse.data as any).results || [];
          setExhibitions(exhibitionsData);
        }
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
      }

      // Fetch products
      try {
        const productsResponse = await apiService.getProducts({ page_size: 200 });
        if (productsResponse.success && productsResponse.data) {
          let productsData = [];
          if (Array.isArray(productsResponse.data)) {
            productsData = productsResponse.data;
          } else if (productsResponse.data && typeof productsResponse.data === 'object') {
            if (Array.isArray(productsResponse.data.results)) {
              productsData = productsResponse.data.results;
            } else if (Array.isArray(productsResponse.data.data)) {
              productsData = productsResponse.data.data;
            }
          }
          setProducts(productsData);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev: string[]) =>
      prev.includes(fieldKey)
        ? prev.filter((f: string) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map((f) => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const downloadFile = (blob: Blob, fileFormat: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError('Please select at least one field to export');
      return;
    }

    try {
      setExporting(true);
      setError(null);

      const response = await apiService.exportCustomers({
        format,
        fields: selectedFields,
        start_date: exportDateRange?.from ? exportDateRange.from.toISOString() : undefined,
        end_date: exportDateRange?.to ? exportDateRange.to.toISOString() : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        store: storeFilter !== 'all' ? storeFilter : undefined,
        lead_source: leadSourceFilter !== 'all' ? leadSourceFilter : undefined,
        created_by: createdByFilter !== 'all' ? createdByFilter : undefined,
        exhibition: exhibitionFilter !== 'all' ? exhibitionFilter : undefined,
        product: productFilter !== 'all' ? productFilter : undefined,
        search: searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined,
      });

      if (response.success) {
        // The response.data is already a blob from the API service
        const blob = response.data;

        // Check if blob is valid
        if (!(blob instanceof Blob)) {
          // Try to create a blob from the data if it's a string
          if (typeof response.data === 'string') {
            const newBlob = new Blob([response.data], {
              type: format === 'csv' ? 'text/csv' : 'application/json'
            });
            downloadFile(newBlob, format);
            onSuccess();
            onClose();
            return;
          }

          setError('Invalid file data received from server');
          return;
        }

        // Download the blob
        downloadFile(blob, format);
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to export customers');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export customers. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[96vh] !max-h-[96vh] overflow-hidden flex flex-col !p-4 sm:!p-6 lg:!p-8">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Export Customers
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            Select the format and fields you want to export
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 sm:space-y-8 pr-2 sm:pr-3 pb-4">
          {/* Filters Section */}
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-6 sm:mb-8">
                <Filter className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold text-text-primary">Filters</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Search Filter - Full Width */}
                <div className="space-y-2 md:col-span-2 lg:col-span-4">
                  <Label className="text-sm font-medium text-text-primary">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 h-11"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Date Range</Label>
                  <DateRangeFilter
                    dateRange={exportDateRange}
                    onDateRangeChange={setExportDateRange}
                    placeholder="Select date range (optional)"
                    showPresets={true}
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Statuses'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(SALES_STAGE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                      <SelectItem value="vvip">VVIP</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Store Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Store</Label>
                  <Select value={storeFilter} onValueChange={setStoreFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Stores'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Stores</SelectItem>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name} {store.code ? `(${store.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lead Source Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Lead Source</Label>
                  <Select value={leadSourceFilter} onValueChange={setLeadSourceFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Lead Sources'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Lead Sources</SelectItem>
                      <SelectItem value="General Walk-in">General Walk-in</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Newspaper">Newspaper</SelectItem>
                      <SelectItem value="Hoarding">Hoarding</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Exhibition">Exhibition</SelectItem>
                      <SelectItem value="Television">Television</SelectItem>
                      <SelectItem value="Radio">Radio</SelectItem>
                      <SelectItem value="Magazine">Magazine</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                      <SelectItem value="SMS Campaign">SMS Campaign</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Created By Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Created By</Label>
                  <Select value={createdByFilter} onValueChange={setCreatedByFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Users'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Users</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exhibition Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Exhibition Name</Label>
                  <Select value={exhibitionFilter} onValueChange={setExhibitionFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Exhibitions'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Exhibitions</SelectItem>
                      {exhibitions.map((exhibition) => (
                        <SelectItem key={exhibition.id} value={exhibition.id.toString()}>
                          {exhibition.name} {exhibition.date ? `(${new Date(exhibition.date).toLocaleDateString()})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Interest Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-text-primary">Product Interest</Label>
                  <Select value={productFilter} onValueChange={setProductFilter} disabled={loadingFilters}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={loadingFilters ? 'Loading...' : 'All Products'} />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="all">All Products</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-text-muted">
                    Export customers who have interest in the selected product
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection and Fields Selection - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Format Selection */}
            <Card className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-text-primary">Export Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[250]">
                      <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                      <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Fields Selection - Takes 3 columns */}
            <Card className="shadow-sm lg:col-span-3">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-text-primary">Select Fields to Export</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-8 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="h-8 text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4 sm:p-6 max-h-[400px] sm:max-h-[500px] overflow-y-auto bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                      {availableFields.map((field) => (
                        <div key={field.key} className="flex items-center space-x-2 group">
                          <Checkbox
                            id={field.key}
                            checked={selectedFields.includes(field.key)}
                            onCheckedChange={() => handleFieldToggle(field.key)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <Label
                            htmlFor={field.key}
                            className="text-sm text-text-secondary cursor-pointer group-hover:text-text-primary transition-colors whitespace-nowrap"
                          >
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    {selectedFields.length} of {availableFields.length} fields selected
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>


          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 w-full sm:w-auto"
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedFields.length === 0 || exporting}
            className="flex-1 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Customers
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
