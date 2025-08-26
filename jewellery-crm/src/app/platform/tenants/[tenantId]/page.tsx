'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Edit, Save, X, MapPin, Phone, Mail, Globe, Users, Calendar, Building } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import Link from 'next/link';

interface Tenant {
  id: number;
  name: string;
  business_type: string;
  industry: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  google_maps_url: string;
  subscription_plan: string;
  subscription_status: string;
  is_active: boolean;
  max_users: number;
  max_storage_gb: number;
  created_at: string;
  updated_at: string;
  users: Array<{
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  }>;
  user_count: number;
}

export default function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Tenant>>({});

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching tenant details for ID:', tenantId);
        const response = await apiService.getTenant(tenantId);
        console.log('Tenant API Response:', response);
        
        if (response.success && response.data) {
          setTenant(response.data);
          setEditData(response.data);
        } else {
          console.log('API response failed:', response);
          setError(`Failed to fetch tenant: ${response.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(`Failed to load tenant data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenant) return;
    
    try {
      console.log('Saving tenant data:', editData);
      const response = await apiService.updateTenant(tenantId, editData);
      
      if (response.success) {
        setTenant(response.data);
        setIsEditing(false);
        console.log('Tenant updated successfully');
      } else {
        console.error('Failed to update tenant:', response.message);
        setError(`Failed to update tenant: ${response.message}`);
      }
    } catch (err) {
      console.error('Error updating tenant:', err);
      setError(`Failed to update tenant: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setEditData(tenant || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Business Details</h1>
          <Link href="/platform/tenants">
            <Button variant="outline">← Back to Tenants</Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading tenant details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Business Details</h1>
          <Link href="/platform/tenants">
            <Button variant="outline">← Back to Tenants</Button>
          </Link>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Error loading tenant</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Business Details</h1>
        <div className="flex gap-2">
          <Link href="/platform/tenants">
            <Button variant="outline">← Back to Tenants</Button>
          </Link>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="btn-secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="btn-primary">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                {isEditing ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-xl font-semibold"
                  />
                ) : (
                  <div className="text-xl font-semibold text-text-primary">{tenant.name}</div>
                )}
                <div className="text-sm text-text-muted">ID: {tenant.id}</div>
              </div>
              <Badge variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}>
                {tenant.subscription_status.charAt(0).toUpperCase() + tenant.subscription_status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-text-primary flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-text-secondary">Business Type</Label>
                    {isEditing ? (
                      <Input
                        value={editData.business_type || ''}
                        onChange={(e) => setEditData({ ...editData, business_type: e.target.value })}
                      />
                    ) : (
                      <div className="font-medium capitalize">{tenant.business_type.replace('_', ' ')}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-text-secondary">Industry</Label>
                    {isEditing ? (
                      <Input
                        value={editData.industry || ''}
                        onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                      />
                    ) : (
                      <div className="font-medium capitalize">{tenant.industry}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-text-secondary">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <div className="font-medium">{tenant.description || 'No description provided'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-text-primary flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-text-secondary">Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      />
                    ) : (
                      <div className="font-medium">{tenant.email}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-text-secondary">Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    ) : (
                      <div className="font-medium">{tenant.phone}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm text-text-secondary">Website</Label>
                    {isEditing ? (
                      <Input
                        value={editData.website || ''}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      />
                    ) : (
                      <div className="font-medium">
                        {tenant.website ? (
                          <a href={tenant.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {tenant.website}
                          </a>
                        ) : (
                          'No website provided'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-text-primary flex items-center mb-3">
                <MapPin className="h-5 w-5 mr-2" />
                Address
              </h3>
              {isEditing ? (
                <Textarea
                  value={editData.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  rows={2}
                />
              ) : (
                <div className="font-medium">{tenant.address}</div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Info */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-text-primary mb-4">Subscription</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-text-secondary">Plan</Label>
                <div className="font-medium capitalize">{tenant.subscription_plan}</div>
              </div>
              <div>
                <Label className="text-sm text-text-secondary">Max Users</Label>
                <div className="font-medium">{tenant.max_users}</div>
              </div>
              <div>
                <Label className="text-sm text-text-secondary">Storage Limit</Label>
                <div className="font-medium">{tenant.max_storage_gb} GB</div>
              </div>
            </div>
          </Card>

          {/* Users Info */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users ({tenant.user_count})
            </h3>
            <div className="space-y-2">
              {tenant.users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-text-secondary">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {tenant.users.length > 5 && (
                <div className="text-sm text-text-secondary text-center">
                  +{tenant.users.length - 5} more users
                </div>
              )}
            </div>
          </Card>

          {/* Timestamps */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Timestamps
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-text-secondary">Created</Label>
                <div className="font-medium">{new Date(tenant.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <Label className="text-sm text-text-secondary">Last Updated</Label>
                <div className="font-medium">{new Date(tenant.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <Card className="p-6">
          <div className="flex gap-2">
            <Button className="btn-secondary">
              Suspend
            </Button>
            <Button className="btn-tertiary" variant="destructive">
              Delete
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
 
 