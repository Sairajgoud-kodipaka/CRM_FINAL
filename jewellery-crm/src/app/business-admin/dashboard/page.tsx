'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import { Users, TrendingUp, Calendar as CalendarIcon, Store, Award, CheckCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from '@/components/notifications';

interface DashboardData {
  // Monthly KPI Metrics
  monthly_sales: {
    count: number;
    revenue: number;
  };
  monthly_customers: {
    new: number;
    total: number;
  };
  // Optional overall customers block (when backend provides consolidated stats)
  customers?: {
    total: number;
    new_this_month?: number;
  };
  monthly_pipeline: {
    active: number;
    closed: number;
    revenue: number;
  };

  // Store Performance for current month
  store_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    sales_count: number;
    closed_deals: number;
  }>;

  // Top Performers for current month
  top_performers: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    role: string;
    store_name?: string;
  }>;
}

// Main dashboard component focused on monthly data
function BusinessAdminDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Get current month date range
  const getCurrentMonthRange = () => {
    const startOfMonth = new Date(currentMonth.year, currentMonth.month, 1);
    const endOfMonth = new Date(currentMonth.year, currentMonth.month + 1, 0, 23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
  };

  // Format month for display
  const formatMonth = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[currentMonth.month]} ${currentMonth.year}`;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const now = new Date();
      const currentDate = { year: now.getFullYear(), month: now.getMonth() };

      // Prevent navigation to future months
      if (prev.year > currentDate.year ||
          (prev.year === currentDate.year && prev.month >= currentDate.month)) {

        return prev; // Stay on current month
      }

      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // Go to current month
  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Fetch dashboard data for current month
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const monthRange = getCurrentMonthRange();


      // CRITICAL: Force fresh data by clearing any cached data first
      setDashboardData(null);

      // Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await apiService.getBusinessAdminDashboard({
        start_date: monthRange.start.toISOString(),
        end_date: monthRange.end.toISOString(),
        filter_type: 'monthly',
        year: currentMonth.year,
        month: currentMonth.month,
        month_name: formatMonth(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });



      if (response.success) {
        // Align monthly customer stats with Customers page by querying the same source
        let monthlyCustomersNew = 0; // today's new customers
        let monthlyCustomersTotal = 0; // total customers this month
        try {
          const customersRes = await apiService.getClients({
            start_date: monthRange.start.toISOString(),
            end_date: monthRange.end.toISOString(),
          });
          if (customersRes.success) {
            const list = Array.isArray(customersRes.data)
              ? (customersRes.data as any[])
              : ((customersRes.data as any)?.results || []);
            monthlyCustomersTotal = list.length || 0;
            // Count only those created today (local day)
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            monthlyCustomersNew = list.filter((c: any) => {
              const createdAt = c?.created_at ? new Date(c.created_at) : null;
              return createdAt && createdAt >= start && createdAt <= end;
            }).length;
          }
        } catch {}

        const normalized = {
          ...response.data,
          monthly_customers: {
            new: monthlyCustomersNew,
            total: monthlyCustomersTotal,
          },
        } as any;

        setDashboardData(normalized);

      } else {
        setError('Failed to load dashboard data');

      }
    } catch (err) {

      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth.year, currentMonth.month]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">Monthly performance overview</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">{formatMonth()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="flex items-center gap-1"
            disabled={currentMonth.year > new Date().getFullYear() ||
                     (currentMonth.year === new Date().getFullYear() && currentMonth.month >= new Date().getMonth())}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-blue-600 hover:text-blue-800"
          >
            Current Month
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {

              setDashboardData(null);
              setLoading(true);
              await fetchDashboardData();
            }}
            className="text-green-600 hover:text-green-800"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Monthly KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Sales */}
        <Card className="shadow-sm border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Monthly Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {dashboardData.monthly_sales?.count || 0}
            </div>
            <p className="text-xs text-blue-600">
              ₹{(dashboardData.monthly_sales?.revenue || 0).toLocaleString('en-IN')} revenue
            </p>
          </CardContent>
        </Card>

        {/* New Customers */}
        <Card className="shadow-sm border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">New Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {dashboardData.monthly_customers?.new || 0}
            </div>
            <p className="text-xs text-green-600">
              {(dashboardData.customers?.total ?? dashboardData.monthly_customers?.total ?? 0)} total customers
            </p>
          </CardContent>
        </Card>

        {/* Active Pipeline */}
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {dashboardData.monthly_pipeline?.active || 0}
            </div>
            <p className="text-xs text-orange-600">
              ₹{(dashboardData.monthly_pipeline?.revenue || 0).toLocaleString('en-IN')} potential
            </p>
          </CardContent>
        </Card>

        {/* Closed Deals */}
        <Card className="shadow-sm border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Closed Deals</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {dashboardData.monthly_pipeline?.closed || 0}
            </div>
            <p className="text-xs text-purple-600">
              deals closed this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Performance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Store Performance - {formatMonth()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(dashboardData.store_performance || []).map((store) => (
              <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{store.name}</h3>
                    <p className="text-sm text-text-secondary">Store #{store.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      ₹{(store.revenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-text-secondary">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {store.sales_count || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {store.closed_deals || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Closed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performers - {formatMonth()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(dashboardData.top_performers || []).map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{performer.name}</h3>
                    <p className="text-sm text-text-secondary">
                      {performer.role} {performer.store_name && `• ${performer.store_name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      ₹{(performer.revenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-text-secondary">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {performer.deals_closed || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Deals</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export component
export default function BusinessAdminDashboard() {
  return <BusinessAdminDashboardContent />;
}