'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart2, PieChart, TrendingUp, Users, Percent, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface AnalyticsData {
  total_sales: {
    today: number;
    week: number;
    month: number;
    today_count: number;
    week_count: number;
    month_count: number;
  };
  pipeline_revenue: number;
  closed_won_pipeline_count: number;
  pipeline_deals_count: number;
  store_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    closed_won_revenue: number;
  }>;
  top_managers: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    recent_revenue?: number;
    store_name?: string;
    store_location?: string;
  }>;
  top_salesmen: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    store_name?: string;
    store_location?: string;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBusinessAdminDashboard();
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load analytics data'}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Monthly Revenue', 
      value: formatCurrency(analyticsData.total_sales.month), 
      icon: <TrendingUp className="w-6 h-6 text-green-600" /> 
    },
    { 
      label: 'Monthly Orders', 
      value: formatNumber(analyticsData.total_sales.month_count), 
      icon: <BarChart2 className="w-6 h-6 text-blue-600" /> 
    },
    { 
      label: 'Pipeline Revenue', 
      value: formatCurrency(analyticsData.pipeline_revenue), 
      icon: <Users className="w-6 h-6 text-purple-600" /> 
    },
    { 
      label: 'Pipeline Deals', 
      value: formatNumber(analyticsData.pipeline_deals_count), 
      icon: <Percent className="w-6 h-6 text-orange-600" /> 
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Business Analytics</h1>
        <p className="text-text-secondary mt-1">Track your business performance and key metrics</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-row items-center gap-4 p-5">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mr-2">{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-text-primary">{s.value}</div>
              <div className="text-sm text-text-secondary font-medium">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sales Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="font-semibold text-text-primary mb-4">Sales Performance</div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Today</span>
              <span className="font-medium">{formatCurrency(analyticsData.total_sales.today)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>This Week</span>
              <span className="font-medium">{formatCurrency(analyticsData.total_sales.week)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>This Month</span>
              <span className="font-medium">{formatCurrency(analyticsData.total_sales.month)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold text-text-primary mb-4">Pipeline Overview</div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Pipeline Revenue</span>
              <span className="font-medium">{formatCurrency(analyticsData.pipeline_revenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Active Deals</span>
              <span className="font-medium">{analyticsData.pipeline_deals_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Closed Won</span>
              <span className="font-medium">{analyticsData.closed_won_pipeline_count}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold text-text-primary mb-4">Store Performance</div>
          <div className="space-y-3">
            {analyticsData.store_performance.slice(0, 3).map((store) => (
              <div key={store.id} className="flex justify-between text-sm">
                <span className="truncate max-w-20">{store.name}</span>
                <span className="font-medium">{formatCurrency(store.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-semibold text-text-primary mb-4">Top Managers</div>
          <div className="space-y-3">
            {analyticsData.top_managers.length > 0 ? (
              analyticsData.top_managers.slice(0, 5).map((manager) => (
                <div key={manager.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{manager.name}</span>
                    {manager.store_name && (
                      <span className="text-xs text-text-muted ml-2">({manager.store_name})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(manager.revenue)}</div>
                    <div className="text-xs text-text-muted">{manager.deals_closed} deals</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-text-muted py-4">No manager data available</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold text-text-primary mb-4">Top Salesmen</div>
          <div className="space-y-3">
            {analyticsData.top_salesmen.length > 0 ? (
              analyticsData.top_salesmen.slice(0, 5).map((salesman) => (
                <div key={salesman.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{salesman.name}</span>
                    {salesman.store_name && (
                      <span className="text-xs text-text-muted ml-2">({salesman.store_name})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(salesman.revenue)}</div>
                    <div className="text-xs text-text-muted">{salesman.deals_closed} deals</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-text-muted py-4">No salesman data available</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
 
 
 