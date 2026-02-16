'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toUtcStartOfDay, toUtcEndOfDay } from '@/lib/date-utils';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { useScopedVisibility } from '@/lib/scoped-visibility';
import { apiService } from '@/lib/api-service';
import { Users, TrendingUp, Calendar as CalendarIcon, Store, Award, CheckCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ScopeIndicator from '@/components/ui/ScopeIndicator';

interface ManagerDashboardData {
  // Monthly KPI Metrics (Store-scoped)
  monthly_sales: {
    count: number;
    revenue: number;
  };
  monthly_customers: {
    new: number;
    total: number;
  };
  monthly_pipeline: {
    active: number;
    closed: number;
    revenue: number;
  };

  // Store Performance for current month (Manager's store only)
  store_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    sales_count: number;
    closed_deals: number;
  }>;

  // Team Performance for current month (Store-scoped)
  team_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    role: string;
    target: number;
    achievement_percentage: number;
  }>;
}

// Main dashboard component focused on monthly data with scoped visibility
function ManagerDashboardContent() {
  const { user } = useAuth();
  const { userScope, canAccessStoreData } = useScopedVisibility();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
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

  // Fetch dashboard data for current month with scoped visibility
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const monthRange = getCurrentMonthRange();

      // CRITICAL: Force fresh data by clearing any cached data first
      setDashboardData(null);

      // Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use manager dashboard API with scoped parameters
      const response = await apiService.getManagerDashboard({
        start_date: toUtcStartOfDay(monthRange.start),
        end_date: toUtcEndOfDay(monthRange.end),
        filter_type: 'monthly',
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
        const errorMsg = response.message || 'Unknown error';
        setError(`Failed to load dashboard data: ${errorMsg}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(`Failed to load dashboard data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [currentMonth.year, currentMonth.month, user?.id, user?.store]);

  useEffect(() => {
    if (user && canAccessStoreData) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user, canAccessStoreData]);


  // Navigation functions
  const navigateToCustomers = () => router.push('/manager/customers');
  const navigateToAppointments = () => router.push('/manager/appointments');
  const navigateToTeam = () => router.push('/manager/team');
  const navigateToAnalytics = () => router.push('/manager/analytics');

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardSkeleton />
        <div className="hidden">
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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header with Month Navigation and Scope Indicator */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {user?.store_name || 'Store'} Dashboard
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">
            Monthly performance overview - {userScope.description}
          </p>
        </div>

        {/* Scope Indicator - Mobile friendly */}
        <div className="flex items-center gap-2">
          <ScopeIndicator showDetails={false} />
        </div>

        {/* Month Navigation - Responsive wrap */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="flex items-center gap-1 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 flex-1 sm:flex-initial justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm sm:text-base font-medium text-blue-800 whitespace-nowrap">
                {formatMonth()}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="flex items-center gap-1 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
              disabled={currentMonth.year > new Date().getFullYear() ||
                       (currentMonth.year === new Date().getFullYear() && currentMonth.month >= new Date().getMonth())}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-blue-600 hover:text-blue-800 min-h-[44px] sm:min-h-0"
          >
            Current Month
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
              {dashboardData.monthly_customers?.total || 0} total customers
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

      {/* Store Performance (Manager's Store Only) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Store className="w-5 h-5" />
            <span className="truncate">Store Performance - {formatMonth()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.store_performance && Array.isArray(dashboardData.store_performance) && dashboardData.store_performance.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.store_performance.map((store: any) => (
                <div key={store.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text-primary truncate">{store.name}</h3>
                      <p className="text-sm text-text-secondary">Store #{store.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 flex-shrink-0">
                    <div className="text-center min-w-[70px]">
                      <div className="text-base sm:text-lg font-semibold text-blue-600 truncate">
                        ₹{(store.revenue || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-text-secondary">Revenue</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-base sm:text-lg font-semibold text-green-600">
                        {store.sales_count || 0}
                      </div>
                      <div className="text-xs text-text-secondary">Sales</div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <div className="text-base sm:text-lg font-semibold text-purple-600">
                        {store.closed_deals || 0}
                      </div>
                      <div className="text-xs text-text-secondary">Closed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No store performance data available for this period</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Store: {user?.store_name || 'Your Store'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Performance (Store-scoped) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Award className="w-5 h-5" />
            <span className="truncate">Team Performance - {formatMonth()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(dashboardData.team_performance || []).map((member: any, index: number) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary truncate">{member.name}</h3>
                    <p className="text-sm text-text-secondary">
                      Team Member
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 flex-shrink-0">
                  <div className="text-center min-w-[70px]">
                    <div className="text-base sm:text-lg font-semibold text-blue-600 truncate">
                      ₹{(member.revenue || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-text-secondary">Revenue</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div className="text-base sm:text-lg font-semibold text-green-600">
                      {member.deals_closed || 0}
                    </div>
                    <div className="text-xs text-text-secondary">Deals</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div className="text-base sm:text-lg font-semibold text-purple-600">
                      {member.target || 0}%
                    </div>
                    <div className="text-xs text-text-secondary">Target</div>
                  </div>
                </div>
              </div>
            ))}
            {(!dashboardData.team_performance || dashboardData.team_performance.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No team performance data available for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowRight className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="h-auto min-h-[80px] sm:h-20 sm:min-h-[80px] flex flex-col items-center justify-center gap-2 p-4 touch-manipulation"
              onClick={navigateToCustomers}
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm text-center">Manage Customers</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto min-h-[80px] sm:h-20 sm:min-h-[80px] flex flex-col items-center justify-center gap-2 p-4 touch-manipulation"
              onClick={navigateToAppointments}
            >
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm text-center">Schedule Appointments</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto min-h-[80px] sm:h-20 sm:min-h-[80px] flex flex-col items-center justify-center gap-2 p-4 touch-manipulation"
              onClick={navigateToTeam}
            >
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm text-center">Team Management</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto min-h-[80px] sm:h-20 sm:min-h-[80px] flex flex-col items-center justify-center gap-2 p-4 touch-manipulation"
              onClick={navigateToAnalytics}
            >
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm text-center">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export component
export default function ManagerDashboard() {
  return <ManagerDashboardContent />;
}