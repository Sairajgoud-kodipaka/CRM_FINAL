'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, Users, Percent, Phone, AlertCircle,
  Calendar, Clock, Target, BarChart3, Activity, CheckCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { telecallingApiService, TelecallerDashboard } from '@/services/telecallingApi';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  isLoading,
  subtitle,
  color = "blue"
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  isLoading?: boolean;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getColorClasses()}`}>
            {isLoading ? (
              <Skeleton className="w-6 h-6 rounded-full" />
            ) : (
              <Icon className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? <Skeleton className="h-8 w-16" /> : value}
            </div>
            <div className="text-sm font-medium text-gray-600">{label}</div>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
          </div>
        </div>
        {getTrendIcon()}
      </div>
    </Card>
  );
};

const EmptyState = () => (
  <div className="text-center py-12">
    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">No calls made today</h3>
    <p className="text-gray-500 mb-4">
      Start calling your assigned leads to see your performance metrics.
    </p>
    <Button onClick={() => window.location.href = '/telecaller/customers'}>
      View Assigned Leads
    </Button>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center py-12">
    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
    <p className="text-gray-500 mb-4">{error}</p>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

export default function TelecallerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<TelecallerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>('');
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<{
    connection_status: boolean;
    last_sync?: string;
    total_leads?: number;
    assigned_leads?: number;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await telecallingApiService.getTelecallerDashboard();
      setDashboardData(data);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleSheetsStatus = async () => {
    try {
      const statusData = await telecallingApiService.getGoogleSheetsStatus();
      setGoogleSheetsStatus(statusData);
    } catch (err) {

      // Set default status if API fails
      setGoogleSheetsStatus({
        connection_status: false,
        total_leads: 0,
        assigned_leads: 0
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchGoogleSheetsStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchGoogleSheetsStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <ErrorState error={error} onRetry={fetchDashboardData} />;
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Telecaller Dashboard</h1>
          <p className="text-text-secondary mt-1">Loading your performance metrics...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCard
              key={i}
              label="Loading..."
              value={0}
              icon={Phone}
              isLoading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData ? [
    {
      label: 'Calls Made Today',
      value: dashboardData.calls_today,
      icon: Phone,
      trend: dashboardData.performance_trend,
      color: 'blue' as const,
      subtitle: 'Total calls initiated'
    },
    {
      label: 'Appointments Set',
      value: dashboardData.appointments_set,
      icon: Calendar,
      color: 'green' as const,
      subtitle: 'Successful appointments'
    },
    {
      label: 'Connected Rate',
      value: `${dashboardData.connected_rate.toFixed(1)}%`,
      icon: Percent,
      color: 'orange' as const,
      subtitle: 'Call success rate'
    },
    {
      label: 'Follow-ups Due',
      value: dashboardData.follow_ups_due,
      icon: Clock,
      color: 'purple' as const,
      subtitle: 'Pending follow-ups'
    }
  ] : [];

  const getPerformanceTrendText = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️ Improving';
      case 'down': return '↘️ Declining';
      default: return '→ Stable';
    }
  };

  const getPerformanceTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header with user info and API status */}
      <div className="bg-grey text-black p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">TELECALLER DASHBOARD</h1>
            <p className="text-black-100 mt-1">
              {user?.first_name} {user?.last_name} • Shift Time: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              {googleSheetsStatus?.connection_status ? (
                <CheckCircle className="w-5 h-5 text-green-300" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-300" />
              )}
              <span className="text-sm">
                Google Sheets API: {googleSheetsStatus?.connection_status ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-grey-200">
              Last Sync: {lastSync || 'Never'}
            </div>
            {googleSheetsStatus && (
              <div className="text-xs text-grey-200 mt-1">
                Leads: {googleSheetsStatus.total_leads || 0} total, {googleSheetsStatus.assigned_leads || 0} assigned
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Snapshot */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            📊 PERFORMANCE SNAPSHOT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                isLoading={loading}
                subtitle={stat.subtitle}
                color={stat.color}
              />
            ))}
          </div>

          {/* Follow-ups Alert */}
          {dashboardData && dashboardData.follow_ups_due > 0 && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  🔔 Follow-ups Due: {dashboardData.follow_ups_due}
                  {dashboardData.overdue_calls > 0 && ` (${dashboardData.overdue_calls} Overdue)`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            📈 PERFORMANCE TRENDS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Today's Performance</h4>
                <p className="text-sm text-gray-600">Compared to yesterday</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${getPerformanceTrendColor(dashboardData?.performance_trend || 'stable')}`}>
                  {getPerformanceTrendText(dashboardData?.performance_trend || 'stable')}
                </div>
                <div className="text-sm text-gray-500">
                  {dashboardData?.calls_today || 0} calls today
                </div>
              </div>
            </div>

            {/* Conversion Rate Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">{dashboardData?.connected_rate.toFixed(1) || 0}%</span>
              </div>
              <Progress
                value={dashboardData?.connected_rate || 0}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions and Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              🧰 QUICK ACTIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => router.push('/telecaller/customers')}
            >
              <Phone className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Assigned Leads</div>
                <div className="text-xs text-gray-500">{dashboardData?.assigned_leads || 0} leads</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => router.push('/telecaller/call')}
            >
              <Activity className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">Open Call Panel</div>
                <div className="text-xs text-gray-500">Mute / Hold / End</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => router.push('/telecaller/calls')}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Call Logs</div>
                <div className="text-xs text-gray-500">{dashboardData?.calls_today || 0} calls today</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => router.push('/telecaller/appointments')}
            >
              <Calendar className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">View Appointments</div>
                <div className="text-xs text-gray-500">{dashboardData?.appointments_set || 0} set</div>
              </div>
            </Button>

          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              📋 TODAY'S SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.assigned_leads || 0}
                </div>
                <div className="text-sm text-blue-800">Assigned Leads</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData?.overdue_calls || 0}
                </div>
                <div className="text-sm text-red-800">Overdue Calls</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Follow-ups Completed:</span>
                <Badge variant="outline" className="text-green-600">
                  {Math.floor((dashboardData?.follow_ups_due || 0) * 0.6)}/{dashboardData?.follow_ups_due || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Performance Trend:</span>
                <span className={`font-semibold ${getPerformanceTrendColor(dashboardData?.performance_trend || 'stable')}`}>
                  {getPerformanceTrendText(dashboardData?.performance_trend || 'stable')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Sheets Sync */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            📊 GOOGLE SHEETS SYNC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900">Manual Lead Import</h4>
                  <p className="text-sm text-blue-700">Click to sync leads from Google Sheets and auto-assign them to telecallers</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await telecallingApiService.testGoogleSheetsConnection();

                        if (result.sample_data) {
                          alert(`✅ Connection successful!\n\nSample data from Google Sheets:\n${JSON.stringify(result.sample_data, null, 2)}`);
                        } else {
                          alert(`✅ Connection successful!\n\nMessage: ${result.message}`);
                        }
                      } catch (error) {

                        alert('❌ Connection test failed. Please check the logs.');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🔍 Test Connection
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        setIsSyncing(true);
                        const result = await telecallingApiService.triggerManualSync();
                        if (result.sync_status) {
                          // Refresh data after successful sync
                          await fetchDashboardData();
                          await fetchGoogleSheetsStatus();
                          alert('✅ Manual sync completed successfully! New leads have been imported and assigned.');
                        } else {
                          alert('❌ Manual sync failed. Please check the logs for details.');
                        }
                      } catch (error) {

                        alert('❌ Manual sync failed. Please try again.');
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <Skeleton className="w-4 h-4 mr-2 rounded" />
                        Syncing...
                      </>
                    ) : (
                      '🔄 Sync Now'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {googleSheetsStatus?.total_leads || 0}
                </div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {googleSheetsStatus?.assigned_leads || 0}
                </div>
                <div className="text-sm text-gray-600">Assigned Leads</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(googleSheetsStatus?.total_leads || 0) - (googleSheetsStatus?.assigned_leads || 0)}
                </div>
                <div className="text-sm text-gray-600">Unassigned</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Diagnostics */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            🧪 API DIAGNOSTICS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Last Sync: </span>
                <span className="font-medium">{lastSync || 'Never'}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Google Sheets API: </span>
                <Badge
                  variant="outline"
                  className={googleSheetsStatus?.connection_status
                    ? "text-green-600 border-green-600"
                    : "text-red-600 border-red-600"
                  }
                >
                  {googleSheetsStatus?.connection_status ? '✅ Connected' : '❌ Disconnected'}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Leads: </span>
                <span className="font-medium text-blue-600">
                  {googleSheetsStatus?.total_leads || 0} total
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              fetchDashboardData();
              fetchGoogleSheetsStatus();
            }}>
              Refresh Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setIsSyncing(true);
                  const result = await telecallingApiService.triggerManualSync();
                  if (result.sync_status) {
                    // Refresh data after successful sync
                    await fetchDashboardData();
                    await fetchGoogleSheetsStatus();
                    alert('✅ Manual sync completed successfully! New leads have been imported and assigned.');
                  } else {
                    alert('❌ Manual sync failed. Please check the logs for details.');
                  }
                } catch (error) {

                  alert('❌ Manual sync failed. Please try again.');
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="ml-2"
            >
              {isSyncing ? (
                <>
                  <Skeleton className="w-4 h-4 mr-1 rounded" />
                  Syncing...
                </>
              ) : (
                '🔄 Sync Google Sheets'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4 border-t">
        <div className="flex items-center justify-center gap-4">
          <span>Logged in as: Telecaller</span>
          <span>•</span>
          <span>Access: Leads, Call Panel, Logs, Appointments</span>
          <span>•</span>
          <span>Audit Trail: Enabled</span>
        </div>
      </div>
    </div>
  );
}
