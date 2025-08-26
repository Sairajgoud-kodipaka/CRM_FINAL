'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone,
  Mail,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';

interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
  manager?: number;
  tenant: number;
  is_active: boolean;
  created_at: string;
}

interface StorePerformance {
  store_id: number;
  store_name: string;
  total_sales: number;  // This is count from backend
  today_sales: number;  // This is revenue from backend
  this_month_sales: number;  // This is revenue from backend
  total_customers: number;
  active_deals: number;
  closed_won_deals: number;
  inventory_value: number;
  staff_count: number;
  today_sales_count: number;
  this_month_sales_count: number;
  all_time_sales_count: number;
}

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  is_active: boolean;
  sales_this_month: number;
  deals_closed: number;
}

interface RecentSale {
  id: number;
  client_name: string;
  total_amount: number;
  created_at: string;
  status: string;
  order_date?: string; // Added for consistency with new_code
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const storeId = params.storeId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [performance, setPerformance] = useState<StorePerformance | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId, user, isAuthenticated, token, router]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch store details
      const storeResponse = await apiService.getStore(storeId);
      
      if (storeResponse.success) {
        setStore(storeResponse.data);
      } else {
        console.error('❌ Store API failed:', storeResponse);
        throw new Error('Failed to fetch store details');
      }

      // Fetch store performance
      try {
        const performanceResponse = await apiService.getStorePerformance(storeId);
        
        if (performanceResponse.success) {
          setPerformance(performanceResponse.data);
        } else {
          console.error('❌ Performance API failed:', performanceResponse);
          console.error('❌ Performance API error message:', performanceResponse.message);
          // Set default performance data to show something
          setPerformance({
            store_id: 0,
            store_name: 'N/A',
            total_sales: 0,
            today_sales: 0,
            this_month_sales: 0,
            total_customers: 0,
            active_deals: 0,
            closed_won_deals: 0,
            inventory_value: 0,
            staff_count: 0,
            today_sales_count: 0,
            this_month_sales_count: 0,
            all_time_sales_count: 0
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch store performance:', error);
        console.error('❌ Performance error details:', error);
        // Set default performance data on error
        setPerformance({
          store_id: 0,
          store_name: 'N/A',
          total_sales: 0,
          today_sales: 0,
          this_month_sales: 0,
          total_customers: 0,
          active_deals: 0,
          closed_won_deals: 0,
          inventory_value: 0,
          staff_count: 0,
          today_sales_count: 0,
          this_month_sales_count: 0,
          all_time_sales_count: 0
        });
      }

      // Fetch store staff
      try {
        const staffResponse = await apiService.getStoreStaff(storeId);
        
        if (staffResponse.success) {
          setStaff(staffResponse.data);
        } else {
          console.error('❌ Staff API failed:', staffResponse);
          console.error('❌ Staff API error message:', staffResponse.message);
          setStaff([]); // Set empty array on failure
        }
      } catch (error) {
        console.error('❌ Failed to fetch store staff:', error);
        console.error('❌ Staff error details:', error);
        setStaff([]); // Set empty array on error
      }

      // Fetch recent sales
      try {
        const salesResponse = await apiService.getStoreRecentSales(storeId);
        
        if (salesResponse.success) {
          setRecentSales(salesResponse.data);
        } else {
          console.error('❌ Sales API failed:', salesResponse);
          console.error('❌ Sales API error message:', salesResponse.message);
          setRecentSales([]); // Set empty array on failure
        }
      } catch (error) {
        console.error('❌ Failed to fetch recent sales:', error);
        console.error('❌ Sales error details:', error);
        setRecentSales([]); // Set empty array on error
      }

    } catch (error) {
      console.error('❌ Error fetching store data:', error);
      console.error('❌ Error details:', error);
      setError('Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBackToDashboard = () => {
    router.push('/business-admin/dashboard');
  };

  const handleEditStore = () => {
    router.push(`/business-admin/settings/stores`);
  };

  const handleViewTeam = () => {
    router.push(`/business-admin/sales-team`);
  };

  const handleViewInventory = () => {
    router.push(`/business-admin/inventory`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store details...</span>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Store not found'}</p>
          <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              {store.name}
            </h1>
            <p className="text-text-secondary mt-1">
              Store Code: {store.code} • {store.city}, {store.state}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant={store.is_active ? "default" : "secondary"}
                className={getStatusColor(store.is_active ? 'active' : 'inactive')}
              >
                {store.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-text-secondary">
                Created: {formatDate(store.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleEditStore}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Store
          </Button>
          <Button onClick={handleViewTeam}>
            <Users className="w-4 h-4 mr-2" />
            View Team
          </Button>
        </div>
      </div>

      {/* Store Performance Overview */}
      {performance ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(performance.today_sales)}
              </div>
              <p className="text-xs text-muted-foreground">
                Today's revenue
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(performance.this_month_sales)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly revenue
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.total_sales}
              </div>
              <p className="text-xs text-muted-foreground">
                All time sales count
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.active_deals}
              </div>
              <p className="text-xs text-muted-foreground">
                {performance.closed_won_deals} closed won
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Today's Sales</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '🔄 Loading...' : '❌ No Data'}
              </div>
              <p className="text-xs text-orange-600">
                {loading ? 'Fetching data...' : 'Performance data not available'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '🔄 Loading...' : '❌ No Data'}
              </div>
              <p className="text-xs text-orange-600">
                {loading ? 'Fetching data...' : 'Performance data not available'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '🔄 Loading...' : '❌ No Data'}
              </div>
              <p className="text-xs text-orange-600">
                {loading ? 'Fetching data...' : 'Performance data not available'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Active Deals</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '🔄 Loading...' : '❌ No Data'}
              </div>
              <p className="text-xs text-orange-600">
                {loading ? 'Fetching data...' : 'Performance data not available'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store Details and Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Store Name</Label>
                    <p className="text-sm mt-1">{store.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Store Code</Label>
                    <p className="text-sm mt-1">{store.code}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-text-secondary">Address</Label>
                    <p className="text-sm mt-1">{store.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">City</Label>
                    <p className="text-sm mt-1">{store.city}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">State</Label>
                    <p className="text-sm mt-1">{store.state}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Timezone</Label>
                    <p className="text-sm mt-1">{store.timezone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-text-secondary">Status</Label>
                    <Badge 
                      variant={store.is_active ? "default" : "secondary"}
                      className={`mt-1 ${getStatusColor(store.is_active ? 'active' : 'inactive')}`}
                    >
                      {store.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performance && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Total Customers</span>
                      <span className="font-medium">{performance.total_customers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Staff Members</span>
                      <span className="font-medium">{performance.staff_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Inventory Value</span>
                      <span className="font-medium">{formatCurrency(performance.inventory_value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Active Deals</span>
                      <span className="font-medium">{performance.active_deals}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length > 0 ? (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {member.role} • {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm text-green-600">
                          {formatCurrency(member.sales_this_month)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {member.deals_closed} deals closed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No team members found</p>
                  {loading && <p className="text-xs mt-2">Loading team data...</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Recent Sales ({recentSales.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.client_name}</TableCell>
                        <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                        <TableCell>{formatDate(sale.order_date || sale.created_at)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={sale.status === 'delivered' ? "default" : "secondary"}
                            className={sale.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {sale.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent sales found</p>
                  {loading && <p className="text-xs mt-2">Loading sales data...</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performance ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-text-secondary">Total Inventory Value</p>
                          <p className="text-2xl font-bold">{formatCurrency(performance.inventory_value)}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-sm text-text-secondary">Total Sales</p>
                          <p className="text-2xl font-bold">{performance.total_sales}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewInventory}
                    >
                      View Full Inventory
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inventory data not available</p>
                  {loading && <p className="text-xs mt-2">Loading inventory data...</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
