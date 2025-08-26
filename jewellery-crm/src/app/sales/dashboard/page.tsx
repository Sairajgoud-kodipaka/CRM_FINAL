'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart2, PieChart, TrendingUp, Users, Percent, Activity, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Calendar, Target } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';

interface SalesStats {
  monthly_revenue: number;
  total_sales: number;
  customers: number;
  conversion_rate: number;
  recent_activities: any[];
  top_products: any[];
}

export default function SalesDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<SalesStats>({
    monthly_revenue: 0,
    total_sales: 0,
    customers: 0,
    conversion_rate: 0,
    recent_activities: [],
    top_products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
      try {
        setLoading(true);
      setError(null);
      
      console.log('Fetching real sales dashboard data...');
        
      // Fetch sales dashboard data
        const dashboardResponse = await apiService.getSalesDashboard();
      console.log('Sales Dashboard response:', dashboardResponse);
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data;
        console.log('Dashboard data:', dashboardData);
        
        // Fetch recent appointments for activities
        const appointmentsResponse = await apiService.getAppointments();
        console.log('Appointments response:', appointmentsResponse);
        
        let recentActivities = [];
        if (appointmentsResponse.success && appointmentsResponse.data) {
          const appointments = Array.isArray(appointmentsResponse.data) 
            ? appointmentsResponse.data 
            : (appointmentsResponse.data as any)?.results || [];
          
          recentActivities = appointments.slice(0, 6).map((appointment: any) => ({
            type: 'appointment',
            title: appointment.purpose || 'Appointment',
            date: new Date(appointment.date).toLocaleDateString('en-IN'),
            time: appointment.time || 'N/A'
          }));
        }
        
        // Fetch recent sales for activities
        const salesResponse = await apiService.getSales();
        console.log('Sales response:', salesResponse);
        
        let salesActivities = [];
        if (salesResponse.success && salesResponse.data) {
          const sales = Array.isArray(salesResponse.data) 
            ? salesResponse.data 
            : (salesResponse.data as any)?.results || [];
          
          salesActivities = sales.slice(0, 3).map((sale: any) => ({
            type: 'sale',
            title: `Sale #${sale.order_number}`,
            date: new Date(sale.created_at).toLocaleDateString('en-IN'),
            time: new Date(sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            amount: sale.total_amount
          }));
        }
        
        // Combine and sort activities
        const allActivities = [...recentActivities, ...salesActivities];
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Get top products from customer interests instead of sales
        let topProducts: Array<{name: string, sales: number, rank: number}> = [];
        
        // Fetch customers to get their interests
        const customersResponse = await apiService.getClients();
        console.log('Customers response:', customersResponse);
        
        if (customersResponse.success && customersResponse.data) {
          const customers = Array.isArray(customersResponse.data) 
            ? customersResponse.data 
            : (customersResponse.data as any)?.results || [];
          
          // Group customer interests by product and calculate popularity
          const productInterests = new Map();
          
          customers.forEach((customer: any) => {
            if (customer.customer_interests && Array.isArray(customer.customer_interests)) {
              customer.customer_interests.forEach((interest: any) => {
                if (interest.product && interest.product.name) {
                  const productName = interest.product.name;
                  const currentCount = productInterests.get(productName) || 0;
                  productInterests.set(productName, currentCount + 1);
                }
              });
            }
          });
          
          // Convert to array and sort by interest count
          const productArray = Array.from(productInterests.entries()).map(([name, count]) => ({
            name,
            sales: count as number // Using 'sales' field for consistency, but it's actually interest count
          }));
          
          // Sort by interest count (descending) and take top 4
          topProducts = productArray
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 4)
            .map((product, index) => ({
              ...product,
              rank: index + 1
            }));
          
          console.log('Top products from customer interests:', topProducts);
        }
        
        // If no customer interests data, show a message
        if (topProducts.length === 0) {
          topProducts = [
            { name: 'No customer interests available', rank: 1, sales: 0 }
          ];
        }
        
        setStats({
          monthly_revenue: dashboardData.monthly_revenue || 0,
          total_sales: dashboardData.sales_count || 0,
          customers: dashboardData.total_customers || 0,
          conversion_rate: dashboardData.conversion_rate || 0,
          recent_activities: allActivities.slice(0, 6),
          top_products: topProducts
        });
        
        setLastUpdated(new Date());
        
        toast({
          title: "Dashboard Updated",
          description: "Successfully loaded real sales data",
          variant: "default",
        });
      } else {
        console.error('Failed to fetch dashboard data:', dashboardResponse);
        setError('Failed to fetch sales dashboard data');
        toast({
          title: "Error",
          description: 'Failed to fetch sales dashboard data',
          variant: "destructive",
        });
      }
      } catch (error: any) {
      console.error('Error fetching sales data:', error);
      setError('Failed to fetch sales data. Please try again.');
      toast({
        title: "Error",
        description: 'Failed to fetch sales data. Please try again.',
        variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'followup':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'demo':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'sale':
        return <ShoppingBag className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Sales Dashboard</h1>
          <p className="text-text-secondary mt-1">Track your personal sales performance</p>
        </div>
        
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Activity className="w-16 h-16 mx-auto" />
              </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Dashboard</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={fetchSalesData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
            </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Sales Dashboard</h1>
          <p className="text-text-secondary mt-2 text-lg">Track your personal sales performance and achievements</p>
          {lastUpdated && (
            <p className="text-xs text-text-muted mt-2">
              Last updated: {lastUpdated.toLocaleString('en-IN', { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          )}
        </div>
        <button
          onClick={fetchSalesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <BarChart2 className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.monthly_revenue)}</p>
              <p className="text-xs text-text-muted mt-1">Current month earnings</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-text-primary">{stats.total_sales}</p>
              <p className="text-xs text-text-muted mt-1">Sales + Closed deals</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Customers</p>
              <p className="text-2xl font-bold text-text-primary">{stats.customers}</p>
              <p className="text-xs text-text-muted mt-1">Total customer base</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-text-primary">{formatPercentage(stats.conversion_rate)}</p>
              <p className="text-xs text-text-muted mt-1">Deals per customer</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
            <Percent className="w-6 h-6 text-orange-600" />
          </div>
          </div>
        </Card>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {stats.recent_activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-secondary">{activity.date}</span>
                    <span className="text-xs text-text-muted">•</span>
                    <span className="text-xs text-text-muted">{activity.time}</span>
                    {activity.amount && (
                      <>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs font-medium text-green-600">
                          ₹{activity.amount.toLocaleString('en-IN')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Top Products</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-4">
            {stats.top_products.length === 0 || (stats.top_products.length === 1 && stats.top_products[0].sales === 0) ? (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No customer interests data available</p>
                <p className="text-xs text-gray-400 mt-1">Start adding customer interests to see popular products</p>
              </div>
            ) : (
              stats.top_products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{product.rank}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{product.name}</p>
                      <p className="text-xs text-text-secondary">{product.sales} customers interested</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {product.sales > 0 && (
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(product.sales / stats.top_products[0].sales) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
