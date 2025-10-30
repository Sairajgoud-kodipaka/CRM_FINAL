'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { TrashModal } from '@/components/customers/TrashModal';
import { ImportModal } from '@/components/customers/ImportModal';
import { apiService, Client } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { Search, Download, Plus, Eye, Edit, Trash2, Archive, Upload } from 'lucide-react';
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';
import { TableSkeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { DateRange } from 'react-day-picker';
import { getCurrentMonthDateRange, formatDateRange } from '@/lib/date-utils';

export default function ManagerCustomersPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Client | null>(null);
  const [filteredCustomers, setFilteredCustomers] = useState<Client[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => getCurrentMonthDateRange());

  // Check if user can delete customers (managers and higher roles)
  const canDeleteCustomers = user?.role && ['platform_admin', 'business_admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchCustomers();
  }, [dateRange, statusFilter]);

  useEffect(() => {
    // Filter customers based on search term and status
    let filtered = customers || [];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);


      const response = await apiService.getClients({
        start_date: dateRange?.from?.toISOString(),
        end_date: dateRange?.to?.toISOString(),
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      });



      if (response.success && response.data && Array.isArray(response.data)) {

        setCustomers(response.data);
      } else {

        setCustomers([]);
      }
    } catch (error) {

      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailModalOpen(true);
  };

  const handleEditCustomer = (customer: Client) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await apiService.deleteClient(customerId);
      if (response.success) {

        alert('Customer permanently deleted from database!');
        fetchCustomers(); // Refresh the list
      } else {

        alert('Failed to delete customer. Please try again.');
      }
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
  };

  const handleCustomerUpdated = () => {
    setEditModalOpen(false);
    setSelectedCustomer(null);
    fetchCustomers(); // Refresh the list
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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prospect':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'exhibition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return '';
    }
  };

  // Define columns for ResponsiveTable
  const getCustomerColumns = (): ResponsiveColumn<Client>[] => [
    {
      key: 'name',
      title: 'Customer',
      priority: 'high',
      mobileLabel: 'Name',
      render: (value, row) => (
        <span className="font-medium text-text-primary">
          {(row as Client).first_name} {(row as Client).last_name}
        </span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      priority: 'high',
      mobileLabel: 'Email',
      render: (value) => (
        <span className="text-text-primary">{value as string}</span>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      priority: 'medium',
      mobileLabel: 'Phone',
      render: (value) => (
        <span className="text-text-primary">{value as string || '-'}</span>
      ),
    },
    {
      key: 'salesperson',
      title: 'Salesperson',
      priority: 'medium',
      mobileLabel: 'Salesperson',
      render: (value, row) => {
        const customer = row as Client;
        const salespersonName = customer.created_by
          ? `${customer.created_by.first_name} ${customer.created_by.last_name}`
          : customer.assigned_to
            ? `User ID: ${customer.assigned_to}`
            : '-';
        return <span className="text-text-primary">{salespersonName}</span>;
      },
    },
    {
      key: 'status',
      title: 'Status',
      priority: 'high',
      mobileLabel: 'Status',
      render: (value) => {
        const status = value as string || 'unknown';
        return (
          <Badge
            variant={getStatusBadgeVariant(status)}
            className={`capitalize text-xs font-semibold ${getStatusBadgeClasses(status)}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      title: 'Created',
      priority: 'low',
      mobileLabel: 'Created',
      render: (value) => (
        <span className="text-text-secondary">
          {value ? formatDate(value as string) : '-'}
        </span>
      ),
    },
  ];

  const exportCustomers = async (format: 'csv' | 'json') => {
    try {
      const response = await apiService.exportCustomers({
        format,
        fields: ['first_name', 'last_name', 'email', 'phone', 'status', 'customer_type', 'created_at']
      });

      if (response.success && response.data) {
        // Create and download the file
        const blob = new Blob([response.data], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {

      alert('Failed to export customers');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="h-10 w-80 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
          <TableSkeleton rows={8} columns={6} />
        </Card>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <AddCustomerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          fetchCustomers(); // Refresh the list when modal closes
        }}
        onCustomerCreated={() => {
          fetchCustomers(); // Refresh the list after customer creation
        }}
      />
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          fetchCustomers(); // Refresh the list after successful import
        }}
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Customers</h1>
          <p className="text-text-secondary mt-1">View and manage your store's customers</p>
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
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
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
              <option value="all">All Status</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
              <option value="exhibition">Exhibition</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <ResponsiveTable
            data={filteredCustomers as unknown as Record<string, unknown>[]}
            columns={getCustomerColumns() as unknown as ResponsiveColumn<Record<string, unknown>>[]}
            loading={loading}
            searchable={false} // We have our own search above
            selectable={false}
            onRowClick={(customer) => handleViewCustomer((customer as unknown as Client).id.toString())}
            onAction={(action, customer) => {
              const client = customer as unknown as Client;
              switch (action) {
                case 'view':
                  handleViewCustomer(client.id.toString());
                  break;
                case 'edit':
                  handleEditCustomer(client);
                  break;
                case 'delete':
                  if (window.confirm(`Are you sure you want to move ${client.first_name} ${client.last_name} to trash? You can restore them later from the Trash section.`)) {
                    handleDeleteCustomer(client.id.toString());
                  }
                  break;
              }
            }}
            mobileCardTitle={(customer) => {
              const client = customer as unknown as Client;
              return `${client.first_name} ${client.last_name}`;
            }}
            mobileCardSubtitle={(customer) => {
              const client = customer as unknown as Client;
              return client.email;
            }}
            mobileCardActions={(customer) => {
              const client = customer as unknown as Client;
              return (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCustomer(client.id.toString());
                    }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                    <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCustomer(client);
                    }}
                          className="text-green-600 hover:text-green-800"
                        >
                    <Edit className="w-4 h-4" />
                        </Button>
                        {canDeleteCustomers && (
                          <Button
                            variant="ghost"
                            size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to move ${client.first_name} ${client.last_name} to trash? You can restore them later from the Trash section.`)) {
                          handleDeleteCustomer(client.id.toString());
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
              );
            }}
            emptyState={
              <div className="text-center py-8">
                <p className="text-text-secondary">
                    {customers.length === 0 ? 'No customers found' : 'No customers match your search criteria'}
                </p>
              </div>
            }
          />
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
