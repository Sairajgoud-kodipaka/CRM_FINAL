'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import { Users, TrendingUp, Package, DollarSign, Calendar, ShoppingBag, Loader2, Target, Store, Award, Filter, X, CheckCircle, ArrowRight } from 'lucide-react';

import { NotificationBell } from '@/components/notifications';

interface DashboardData {
  // KPI Metrics
  total_sales: {
    period: number; // New field for filtered period
    today: number;
    week: number;
    month: number;
    period_count: number; // New field for filtered period count
    today_count: number;
    week_count: number;
    month_count: number;
  };
  pipeline_revenue: number;
  closed_won_pipeline_count: number;
  pipeline_deals_count: number;
  
  // Store Performance
  store_performance: Array<{
    id: number;
    name: string;
    revenue: number;
    closed_won_revenue: number;
  }>;
  
  // Top Performers
  top_managers: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    avatar?: string;
    store_name?: string;
  }>;
  
  top_salesmen: Array<{
    id: number;
    name: string;
    revenue: number;
    deals_closed: number;
    avatar?: string;
    store_name?: string;
  }>;
}

// Date filter options
const dateFilterOptions = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Yesterday', value: 'yesterday', days: -1 },
  { label: 'Last 7 Days', value: 'last7days', days: -7 },
  { label: 'Last 30 Days', value: 'last30days', days: -30 },
  { label: 'This Week', value: 'thisWeek', days: 0 },
  { label: 'This Month', value: 'thisMonth', days: 0 },
  { label: 'Last Month', value: 'lastMonth', days: -30 },
  { label: 'Custom Range', value: 'custom', days: 0 },
];

export default function BusinessAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Click outside handler for date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCustomDatePicker && !target.closest('.date-picker-container')) {
        setShowCustomDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get date range based on selected filter
  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();
    
    switch (selectedDateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(today.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(today.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate.setTime(new Date(customStartDate).getTime());
          endDate.setTime(new Date(customEndDate).getTime());
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };

  // Format date for display
  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const start = startDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    const end = endDate.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
    
    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  };

  // Fetch dashboard data with date filter
  const fetchDashboardData = useCallback(async () => {
    if (!user?.tenant) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get date range based on selected filter
      const { startDate, endDate } = getDateRange();
      
      const response = await apiService.getBusinessAdminDashboard({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        filter_type: selectedDateFilter
      });
      
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError('Failed to load dashboard data');
        }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
  }, [user?.tenant, selectedDateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (user?.tenant) {
      fetchDashboardData();
    }
  }, [user?.tenant, fetchDashboardData]);

  // Handle date filter change
  const handleDateFilterChange = (filter: string) => {
    setSelectedDateFilter(filter);
    if (filter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomStartDate('');
      setCustomEndDate('');
    }
    
    // Force a data refresh when filter changes
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  // Apply custom date range
  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setSelectedDateFilter('custom');
      setShowCustomDatePicker(false);
    }
  };

  // Clear custom date range
  const clearCustomDateRange = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedDateFilter('today');
    setShowCustomDatePicker(false);
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

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'business_admin':
        return 'Business Admin';
      case 'manager':
        return 'Manager';
      case 'inhouse_sales':
        return 'In-house Sales';
      default:
        return 'User';
    }
  };

  const getScopeDescription = () => {
    switch (user?.role) {
      case 'business_admin':
        return 'All combined data across all stores';
      case 'manager':
        return `Data for ${user?.store_name || 'your store'}`;
      case 'inhouse_sales':
        return `Data for ${user?.store_name || 'your store'}`;
      default:
        return 'Your data';
    }
  };

  // Navigation handlers for buttons
  const handleViewReports = () => {
    router.push('/business-admin/analytics');
  };

  const handleStoreCardClick = (storeId: number) => {
    router.push(`/business-admin/stores/${storeId}`);
  };

  const handleManagerCardClick = (managerId: number) => {
    router.push(`/business-admin/team/${managerId}`);
  };

  const handleSalesmanCardClick = (salesmanId: number) => {
    router.push(`/business-admin/team/${salesmanId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard data'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Business Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Welcome back, {user?.first_name || user?.username || 'Admin'}! Here's your business overview.
          </p>
          <p className="text-sm text-text-secondary mt-1">
            <span className="font-medium">{getRoleDisplayName()}</span> • {getScopeDescription()}
          </p>
          {/* Date Filter Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-text-secondary">Showing data for:</span>
            <Badge variant="secondary" className="text-xs">
              {selectedDateFilter === 'today' && 'Today'}
              {selectedDateFilter === 'yesterday' && 'Yesterday'}
              {selectedDateFilter === 'last7days' && 'Last 7 Days'}
              {selectedDateFilter === 'last30days' && 'Last 30 Days'}
              {selectedDateFilter === 'thisWeek' && 'This Week'}
              {selectedDateFilter === 'thisMonth' && 'This Month'}
              {selectedDateFilter === 'lastMonth' && 'Last Month'}
              {selectedDateFilter === 'custom' && 'Custom Range'}
            </Badge>
            <span className="text-xs text-text-secondary">
              {formatDateRange()}
            </span>
            {/* Data Loading Indicator */}
            {loading && (
              <Badge variant="outline" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading...
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          
          {/* Date Filter Component */}
          <div className="relative date-picker-container">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                className="min-w-[220px] justify-between bg-white hover:bg-gray-50 border-gray-300"
              >
            <Calendar className="w-4 h-4 mr-2" />
                <span className="truncate">{formatDateRange()}</span>
                <Filter className="w-4 h-4 ml-2" />
              </Button>
              
              {/* Test Buttons for Quick Testing */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateFilterChange('today')}
                  className="text-xs px-2"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateFilterChange('last7days')}
                  className="text-xs px-2"
                >
                  7D
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateFilterChange('last30days')}
                  className="text-xs px-2"
                >
                  30D
                </Button>
              </div>
            </div>
            
            {/* Date Filter Dropdown */}
            {showCustomDatePicker && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Select Date Range</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomDatePicker(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Quick Date Options */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {dateFilterOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedDateFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateFilterChange(option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                
                {/* Custom Date Range */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      max={customEndDate || undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={customStartDate || undefined}
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={applyCustomDateRange}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCustomDateRange}
                    className="flex-1"
                  >
                    Clear
          </Button>
                </div>
              </div>
            )}
          </div>
          
          <Button size="sm" onClick={handleViewReports}>
            <TrendingUp className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Sales (Filtered by Date) */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Date Filtered Sales</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.total_sales.period || dashboardData.total_sales.today)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedDateFilter === 'today' ? 'Today' : 
               selectedDateFilter === 'yesterday' ? 'Yesterday' :
               selectedDateFilter === 'last7days' ? 'Last 7 Days' :
               selectedDateFilter === 'last30days' ? 'Last 30 Days' :
               selectedDateFilter === 'thisWeek' ? 'This Week' :
               selectedDateFilter === 'thisMonth' ? 'This Month' :
               selectedDateFilter === 'lastMonth' ? 'Last Month' :
               selectedDateFilter === 'custom' ? 'Custom Range' : 'Period'}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              {dashboardData.total_sales.period_count || dashboardData.total_sales.today_count || 0} sales
            </p>
          </CardContent>
        </Card>

        {/* Today's Sales (Always shows today's data) */}
        <Card className="shadow-sm border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Today's Sales</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(dashboardData.total_sales.today)}
            </div>
            <p className="text-xs text-green-600">
              {dashboardData.total_sales.today_count || 0} sales today
            </p>
          </CardContent>
        </Card>
        
        {/* Pipeline Revenue */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.pipeline_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.pipeline_deals_count} active deals
            </p>
          </CardContent>
        </Card>
        
        {/* Closed Won Pipeline */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Won</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.closed_won_pipeline_count}
            </div>
            <p className="text-xs text-muted-foreground">
              deals closed this month
            </p>
          </CardContent>
        </Card>
        
        {/* Total Sales (All Time) */}
        <Card className="shadow-sm border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(dashboardData.total_sales.month)}
            </div>
            <p className="text-xs text-blue-600">
              This month total
            </p>
          </CardContent>
        </Card>
      </div>



      {/* Data Summary Section */}
      <Card className="shadow-sm border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <span>📊 Data Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">
                {formatCurrency(dashboardData.total_sales.period || dashboardData.total_sales.today)}
              </div>
              <div className="text-blue-600 font-medium">
                {selectedDateFilter === 'today' ? 'Today\'s Sales' : 
                 selectedDateFilter === 'yesterday' ? 'Yesterday\'s Sales' :
                 selectedDateFilter === 'last7days' ? 'Last 7 Days Sales' :
                 selectedDateFilter === 'last30days' ? 'Last 30 Days Sales' :
                 selectedDateFilter === 'thisWeek' ? 'This Week Sales' :
                 selectedDateFilter === 'thisMonth' ? 'This Month Sales' :
                 selectedDateFilter === 'lastMonth' ? 'Last Month Sales' :
                 selectedDateFilter === 'custom' ? 'Custom Range Sales' : 'Period Sales'}
              </div>
              <div className="text-blue-500 text-xs">
                {dashboardData.total_sales.period_count || dashboardData.total_sales.today_count || 0} sales
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(dashboardData.total_sales.today)}
              </div>
              <div className="text-green-600 font-medium">Today's Sales</div>
              <div className="text-green-500 text-xs">
                {dashboardData.total_sales.today_count || 0} sales today
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(dashboardData.total_sales.month)}
              </div>
              <div className="text-purple-600 font-medium">This Month Total</div>
              <div className="text-purple-500 text-xs">
                All sales this month
              </div>
            </div>
          </div>
          
          {/* Filter Status */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <span className="text-sm font-medium">Current Filter:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedDateFilter === 'today' && 'Today'}
                {selectedDateFilter === 'yesterday' && 'Yesterday'}
                {selectedDateFilter === 'last7days' && 'Last 7 Days'}
                {selectedDateFilter === 'last30days' && 'Last 30 Days'}
                {selectedDateFilter === 'thisWeek' && 'This Week'}
                {selectedDateFilter === 'thisMonth' && 'This Month'}
                {selectedDateFilter === 'lastMonth' && 'Last Month'}
                {selectedDateFilter === 'custom' && 'Custom Range'}
              </Badge>
              <span className="text-xs">• {formatDateRange()}</span>
            </div>
            
            {/* Data Explanation */}
            <div className="mt-3 text-center">
              <div className="text-xs text-blue-500 space-y-1">
                <div>💡 <strong>Date Filtered Sales</strong>: Shows data for your selected period only</div>
                <div>💡 <strong>Today's Sales</strong>: Always shows today's actual sales (independent of filter)</div>
                <div>💡 <strong>This Month Total</strong>: Shows all sales for the current month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Section - Store-wise Performance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Store-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.store_performance.map((store, index) => (
              <div 
                key={store.id} 
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] transition-all duration-200 border-gray-200 hover:border-blue-300 group"
                onClick={() => handleStoreCardClick(store.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text-primary">{store.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Store {index + 1}
                    </Badge>
                    <div className="flex items-center gap-1 text-blue-600">
                      <span className="text-xs font-medium">View details</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Total Revenue:</span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(store.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Closed Won:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(store.closed_won_revenue)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    All combined closed won - Revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Team Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sales Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.top_salesmen.length}
              </div>
              <div className="text-xs text-blue-600">Team Members</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardData.top_salesmen.reduce((sum, s) => sum + s.revenue, 0))}
              </div>
              <div className="text-xs text-green-600">Total Revenue</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => router.push('/business-admin/sales-team')}
          >
            <Users className="w-4 h-4 mr-2" />
            View Full Team
          </Button>
        </CardContent>
      </Card>

      {/* Bottom Section - Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Managers */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performing Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.top_managers.length > 0 ? (
                dashboardData.top_managers.map((manager) => (
                  <div 
                    key={manager.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/business-admin/sales-team`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{manager.name}</div>
                        <div className="text-xs text-text-secondary">
                          {manager.deals_closed} deals closed
                          {manager.store_name && (
                            <span className="ml-2 text-blue-600 font-medium">
                              • {manager.store_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm text-green-600">
                        {formatCurrency(manager.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No manager data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Salesmen */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performing Salesmen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.top_salesmen.length > 0 ? (
                dashboardData.top_salesmen.map((salesman) => (
                  <div 
                    key={salesman.id} 
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/business-admin/sales-team`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{salesman.name}</div>
                        <div className="text-xs text-text-secondary">
                          {salesman.deals_closed} deals closed
                          {salesman.store_name && (
                            <span className="ml-2 text-green-600 font-medium">
                              • {salesman.store_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm text-green-600">
                        {formatCurrency(salesman.revenue)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No salesman data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}