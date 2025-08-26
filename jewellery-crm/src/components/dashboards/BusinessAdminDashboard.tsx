/**
 * Business Admin Dashboard Component
 * 
 * Comprehensive business overview for jewellery business owners.
 * Features business analytics, store management, e-commerce metrics, and team performance.
 * 
 * Key Features:
 * - Business-wide revenue and sales analytics
 * - Multi-store performance comparison
 * - E-commerce and online store metrics
 * - Team member management and performance
 * - Inventory and catalog overview
 * - Customer acquisition and retention metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DashboardLayout, 
  CardContainer,
} from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2,
  Users, 
  ShoppingBag,
  TrendingUp,
  Store,
  Globe,
  Package,
  Heart,
  Plus,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Calendar,
  UserPlus,
  Target,
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface BusinessMetrics {
  revenue: {
    total: number;
    growth: number;
    this_month: number;
    target: number;
  };
  stores: {
    total: number;
    active: number;
    top_performing: string;
  };
  customers: {
    total: number;
    new_this_month: number;
    retention_rate: number;
  };
  ecommerce: {
    orders: number;
    revenue: number;
    conversion: number;
    visitors: number;
  };
  inventory: {
    products: number;
    categories: number;
    low_stock: number;
  };
  store_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    growth: number;
    customers: number;
    staff: number;
    target: number;
  }>;
  team_performance: Array<{
    id: number;
    name: string;
    role: string;
    revenue: number;
    customers: number;
    sales_count: number;
    avatar: string | null;
  }>;
}

/**
 * Business Admin Dashboard Component
 */
export function BusinessAdminDashboard() {
  const [businessData, setBusinessData] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getBusinessAdminDashboard();
        if (response.success) {
          setBusinessData(response.data);
        } else {
          setError('Failed to load business data');
        }
      } catch (err) {
        console.error('Error fetching business data:', err);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout
        title="Business Dashboard"
        subtitle="Loading business data..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !businessData) {
    return (
      <DashboardLayout
        title="Business Dashboard"
        subtitle="Error loading business data"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load business data'}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Navigation handlers for buttons
  const handleBusinessSettings = () => {
    router.push('/business-admin/settings');
  };

  const handleAddStore = () => {
    router.push('/business-admin/stores/new');
  };

  const handleManageStores = () => {
    router.push('/business-admin/stores');
  };

  const handleViewAllTeam = () => {
    router.push('/business-admin/team');
  };

  const handleManageInventory = () => {
    router.push('/business-admin/inventory');
  };

  const handleViewEcommerceStore = () => {
    router.push('/business-admin/ecommerce');
  };

  const handleViewCustomerDetails = () => {
    router.push('/business-admin/customers');
  };

  return (
    <DashboardLayout
      title="Business Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Admin'}! Here's your business overview`}
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleBusinessSettings}>
            <Settings className="w-4 h-4 mr-2" />
            Business Settings
          </Button>
          <Button size="sm" onClick={handleAddStore}>
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
        </div>
      }
    >
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <CardContainer className="border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1" />
                {(businessData.revenue.total / 100000).toFixed(1)}L
              </p>
              <p className={`text-sm font-medium mt-1 flex items-center ${
                businessData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {businessData.revenue.growth >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {businessData.revenue.growth >= 0 ? '+' : ''}{businessData.revenue.growth.toFixed(1)}% this month
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </CardContainer>

        {/* Total Customers */}
        <CardContainer className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
              <p className="text-3xl font-bold text-foreground">{businessData.customers.total}</p>
              <p className="text-sm text-green-600 font-medium mt-1">
                +{businessData.customers.new_this_month} new this month
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContainer>

        {/* E-commerce Revenue */}
        <CardContainer className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Online Revenue</p>
              <p className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1" />
                {(businessData.ecommerce.revenue / 100000).toFixed(1)}L
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {businessData.ecommerce.orders} orders this month
              </p>
            </div>
            <Globe className="h-8 w-8 text-green-500" />
          </div>
        </CardContainer>

        {/* Active Stores */}
        <CardContainer className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Stores</p>
              <p className="text-3xl font-bold text-foreground">{businessData.stores.active}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Top: {businessData.stores.top_performing}
              </p>
            </div>
            <Store className="h-8 w-8 text-purple-500" />
          </div>
        </CardContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Store Performance */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Store Performance</h3>
              <p className="text-sm text-muted-foreground">Revenue and target progress by location</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageStores}>
              <Store className="w-4 h-4 mr-2" />
              Manage Stores
            </Button>
          </div>
          
          <div className="space-y-4">
            {businessData.store_performance.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{(store.revenue / 100000).toFixed(1)}L • {store.customers} customers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    +{store.growth}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {store.staff} staff
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>

        {/* Team Performance */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Team Performance</h3>
              <p className="text-sm text-muted-foreground">Sales and customer metrics by team member</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewAllTeam}>
              <Users className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {businessData.team_performance.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    ₹{(member.revenue / 100000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.sales_count} sales
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Overview */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Inventory</h3>
              <p className="text-sm text-muted-foreground">Product catalog and stock levels</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleManageInventory}>
              <Package className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Products</span>
              <span className="font-medium">{businessData.inventory.products}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Categories</span>
              <span className="font-medium">{businessData.inventory.categories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Stock Items</span>
              <Badge variant="destructive">{businessData.inventory.low_stock}</Badge>
            </div>
          </div>
        </CardContainer>

        {/* E-commerce Metrics */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">E-commerce</h3>
              <p className="text-sm text-muted-foreground">Online store performance</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewEcommerceStore}>
              <Globe className="w-4 h-4 mr-2" />
              View Store
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Orders</span>
              <span className="font-medium">{businessData.ecommerce.orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="font-medium">₹{(businessData.ecommerce.revenue / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conversion</span>
              <span className="font-medium">{businessData.ecommerce.conversion}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Visitors</span>
              <span className="font-medium">{businessData.ecommerce.visitors.toLocaleString()}</span>
            </div>
          </div>
        </CardContainer>

        {/* Customer Retention */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Customer Retention</h3>
              <p className="text-sm text-muted-foreground">Loyalty and engagement metrics</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewCustomerDetails}>
              <Heart className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Retention Rate</span>
              <span className="font-medium">{businessData.customers.retention_rate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">New Customers</span>
              <span className="font-medium text-green-600">+{businessData.customers.new_this_month}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <span className="font-medium">{businessData.customers.total}</span>
            </div>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  );
}