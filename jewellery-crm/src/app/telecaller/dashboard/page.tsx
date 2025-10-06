'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Percent, Phone, Loader2, AlertCircle } from 'lucide-react';
import { telecallingApiService, TelecallerDashboard } from '@/services/telecallingApi';
import { useAuth } from '@/hooks/useAuth';
import { ApiConnectionTest } from '@/components/debug/ApiConnectionTest';

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  isLoading 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: 'up' | 'down' | 'stable';
  isLoading?: boolean;
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  return (
    <Card className="flex flex-row items-center gap-4 p-5">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mr-2">
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        ) : (
          <Icon className="w-6 h-6 text-blue-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-xl font-bold text-text-primary">
          {isLoading ? '...' : value}
        </div>
        <div className="text-sm text-text-secondary font-medium">{label}</div>
      </div>
      {getTrendIcon()}
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
      trend: dashboardData.performance_trend
    },
    { 
      label: 'Appointments Set', 
      value: dashboardData.appointments_set, 
      icon: Users 
    },
    { 
      label: 'Connected Rate', 
      value: `${dashboardData.connected_rate.toFixed(1)}%`, 
      icon: Percent 
    },
    { 
      label: 'Follow-ups Due', 
      value: dashboardData.follow_ups_due, 
      icon: TrendingUp 
    },
  ] : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Telecaller Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Track your personal performance (calls, appointments set)
        </p>
      </div>

      {/* API Connection Test - Remove this after fixing the connection */}
      <ApiConnectionTest />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            isLoading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-semibold mb-2">Quick Actions</div>
          <div className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/telecaller/customers'}
            >
              <Phone className="w-4 h-4 mr-2" />
              View Assigned Leads
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/telecaller/calls'}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Call Logs
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/telecaller/appointments'}
            >
              <Users className="w-4 h-4 mr-2" />
              View Appointments
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-2">Today's Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Assigned Leads:</span>
              <span className="font-medium">{dashboardData?.assigned_leads || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Overdue Calls:</span>
              <span className="font-medium text-red-600">{dashboardData?.overdue_calls || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Performance Trend:</span>
              <span className={`font-medium ${
                dashboardData?.performance_trend === 'up' ? 'text-green-600' :
                dashboardData?.performance_trend === 'down' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {dashboardData?.performance_trend === 'up' ? '↗ Up' :
                 dashboardData?.performance_trend === 'down' ? '↘ Down' :
                 '→ Stable'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {dashboardData?.calls_today === 0 && (
        <EmptyState />
      )}
    </div>
  );
}