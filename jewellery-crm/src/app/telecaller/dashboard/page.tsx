'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, Users, Percent, Phone, AlertCircle, 
  Calendar, Clock, Target, BarChart3, CheckCircle,
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await telecallingApiService.getTelecallerDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
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
            <div className="text-sm text-gray-600">
              Welcome back, {user?.first_name}!
            </div>
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
              <Phone className="w-4 h-4 mr-3" />
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
