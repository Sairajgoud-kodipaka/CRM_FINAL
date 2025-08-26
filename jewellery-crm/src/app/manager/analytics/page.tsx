'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart2, PieChart, TrendingUp, Users, Percent, Activity, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsStats {
  total_customers: number;
  total_sales: number;
  total_products: number;
  total_revenue: number;
  customers_change: string;
  sales_change: string;
  products_change: string;
  revenue_change: string;
  store_info?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  scope?: string;
}

interface RecentActivity {
  type: string;
  message: string;
  details: string;
  icon: string;
}

export default function ManagerAnalyticsPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AnalyticsStats>({
    total_customers: 0,
    total_sales: 0,
    total_products: 0,
    total_revenue: 0,
    customers_change: '+0%',
    sales_change: '+0%',
    products_change: '+0%',
    revenue_change: '+0%',
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching analytics data...');
      console.log('API endpoint: /analytics/dashboard/');
      
      const response = await apiService.getAnalytics();
      console.log('Analytics response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      console.log('Response message:', response.message);
      
      if (response.success && response.data) {
        const data = response.data;
        console.log('Analytics data:', data);
        
        setStats({
          total_customers: data.total_customers || 0,
          total_sales: data.total_sales || 0,
          total_products: data.total_products || 0,
          total_revenue: data.total_revenue || 0,
          customers_change: data.customers_change || '+0%',
          sales_change: data.sales_change || '+0%',
          products_change: data.products_change || '+0%',
          revenue_change: data.revenue_change || '+0%',
        });
        
        setRecentActivity(data.recent_activities || []);
        
        toast({
          title: "Analytics Updated",
          description: "Successfully fetched latest analytics data",
          variant: "default",
        });
      } else {
        console.error('Analytics API error:', response.message);
        console.error('Response details:', response);
        setError(response.message || 'Failed to fetch analytics data');
        toast({
          title: "Error",
          description: response.message || 'Failed to fetch analytics data',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      setError('Failed to fetch analytics data. Please try again.');
      toast({
        title: "Error",
        description: 'Failed to fetch analytics data. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (change: string) => {
    const isPositive = change.startsWith('+');
    const value = change.replace(/[+-]/g, '');
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span className="text-sm font-medium">{value}</span>
      </div>
    );
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'users':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'calendar':
        return <BarChart2 className="w-4 h-4 text-purple-500" />;
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
          <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-text-secondary mt-1">Track your store's performance and key metrics</p>
        </div>
        
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Activity className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Load Analytics</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-text-secondary mt-1">
            {stats.store_info ? `Store: ${stats.store_info.name}` : 'Track your store\'s performance and key metrics'}
          </p>
          {stats.scope === 'store' && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Store-Specific Data
              </span>
            </div>
          )}
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <BarChart2 className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-text-primary">{formatCurrency(stats.total_revenue)}</div>
            <div className="text-sm text-text-secondary font-medium">Revenue</div>
            <div className="text-xs text-text-muted">vs last month</div>
          </div>
          <div className="text-right">
            {formatPercentage(stats.revenue_change)}
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-text-primary">{stats.total_sales}</div>
            <div className="text-sm text-text-secondary font-medium">Orders</div>
            <div className="text-xs text-text-muted">vs last month</div>
          </div>
          <div className="text-right">
            {formatPercentage(stats.sales_change)}
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mr-2">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-text-primary">{stats.total_customers}</div>
            <div className="text-sm text-text-secondary font-medium">Customers</div>
            <div className="text-xs text-text-muted">vs last month</div>
          </div>
          <div className="text-right">
            {formatPercentage(stats.customers_change)}
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mr-2">
            <Percent className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-bold text-text-primary">{stats.total_products}</div>
            <div className="text-sm text-text-secondary font-medium">Products</div>
            <div className="text-xs text-text-muted">vs last month</div>
          </div>
          <div className="text-right">
            {formatPercentage(stats.products_change)}
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-2 p-6 items-center justify-center min-h-[220px]">
          <BarChart2 className="w-12 h-12 text-blue-400 mb-2" />
          <div className="font-semibold text-text-primary">Sales Over Time</div>
          <div className="text-xs text-text-muted">
            {stats.total_sales > 0 ? `${stats.total_sales} orders this month` : 'No sales data available'}
          </div>
        </Card>
        <Card className="flex flex-col gap-2 p-6 items-center justify-center min-h-[220px]">
          <PieChart className="w-12 h-12 text-purple-400 mb-2" />
          <div className="font-semibold text-text-primary">Top Products</div>
          <div className="text-xs text-text-muted">
            {stats.total_products > 0 ? `${stats.total_products} products in catalog` : 'No products available'}
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <div className="font-semibold text-text-primary mb-4">Recent Activity</div>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">No recent activity</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((activity, index) => (
              <li key={index} className="py-3 flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mt-1">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{activity.message}</div>
                  <div className="text-xs text-text-secondary">{activity.details}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      
      {/* Data Scope Information */}
      {stats.scope === 'store' && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-sm text-blue-800">
              Showing analytics data for <strong>{stats.store_info?.name || 'your store'}</strong> only. 
              This includes customers, sales, and products specific to your store location.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
