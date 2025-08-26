'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, Trash2, Eye, Search, Plus, Building2, Users, Calendar } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Tenant {
  id: number;
  name: string;
  business_type: string | null;
  subscription_status: string | null;
  created_at: string;
  users: Array<{
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  }>;
}

export default function TenantsListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { user, token, isAuthenticated } = useAuth();

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getTenants();
      
      if (response.success && response.data) {
        const tenantsData = Array.isArray(response.data) ? response.data : [];
        setTenants(tenantsData);
      } else {
        setError(`Failed to fetch tenants: ${response.message || 'Unknown error'}`);
        setTenants([]);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(`Failed to load tenants data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [user, token, isAuthenticated]);

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteTenant(tenantToDelete.id.toString());
      
      if (response.success) {
        setTenants(prev => prev.filter(t => t.id !== tenantToDelete.id));
        setDeleteDialogOpen(false);
        setTenantToDelete(null);
      } else {
        setError(`Failed to delete tenant: ${response.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting tenant:', err);
      setError(`Failed to delete tenant: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTenantToDelete(null);
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBusinessTypeIcon = (type: string | null) => {
    if (!type) return '🏢';
    
    switch (type) {
      case 'jewelry_store':
        return '💍';
      case 'retail':
        return '🛍️';
      case 'wholesale':
        return '📦';
      case 'manufacturing':
        return '🏭';
      default:
        return '🏢';
    }
  };

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tenant.business_type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tenant.subscription_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout
        title="All Businesses"
        subtitle="Manage tenant organizations across the platform"
        actions={
          <Link href="/platform/tenants/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Tenant</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading tenants...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="All Businesses"
        subtitle="Manage tenant organizations across the platform"
        actions={
          <Link href="/platform/tenants/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Tenant</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading tenants</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tenantsArray = Array.isArray(tenants) ? tenants : [];

  if (tenantsArray.length === 0) {
    return (
      <DashboardLayout
        title="All Businesses"
        subtitle="Manage tenant organizations across the platform"
        actions={
          <Link href="/platform/tenants/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Tenant</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        }
      >
        <CardContainer>
          <div className="text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Tenants Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No tenant businesses are currently registered in the system. 
              You can create a new tenant to get started.
            </p>
            <Link href="/platform/tenants/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Tenant
              </Button>
            </Link>
          </div>
        </CardContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="All Businesses"
      subtitle="Manage tenant organizations across the platform"
      actions={
        <Link href="/platform/tenants/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Tenant</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      }
    >
      {/* Search and Filters */}
      <CardContainer>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tenants by name or business type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('inactive')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Inactive
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Tenants List - Mobile Responsive */}
      <CardContainer>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Business</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Users</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">
                        {getBusinessTypeIcon(tenant.business_type)}
                      </span>
                      <div>
                        <div className="font-medium text-foreground">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {tenant.business_type?.replace('_', ' ') || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground capitalize">
                    {tenant.business_type?.replace('_', ' ') || 'Unknown'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {tenant.users?.length || 0}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={`${getStatusColor(tenant.subscription_status)} border`}>
                      {tenant.subscription_status ? tenant.subscription_status.charAt(0).toUpperCase() + tenant.subscription_status.slice(1) : 'Unknown'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Link href={`/platform/tenants/${tenant.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(tenant)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getBusinessTypeIcon(tenant.business_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tenant.business_type?.replace('_', ' ') || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(tenant.subscription_status)} border`}>
                    {tenant.subscription_status ? tenant.subscription_status.charAt(0).toUpperCase() + tenant.subscription_status.slice(1) : 'Unknown'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{tenant.users?.length || 0} users</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Link href={`/platform/tenants/${tenant.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(tenant)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTenants.length === 0 && tenantsArray.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              No tenants match your current search criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </CardContainer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tenantToDelete?.name}"? This action cannot be undone and will permanently remove all associated data including users, customers, products, and sales records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Tenant'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

 