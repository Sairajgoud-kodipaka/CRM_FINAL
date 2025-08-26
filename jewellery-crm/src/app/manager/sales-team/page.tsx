'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  Activity,
  Trophy,
  UserCheck,
  UserX,
  Store,
  Clock,
  BarChart3
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface SalesPerson {
  user_id: number;
  username: string;
  full_name: string;
  store_name: string;
  is_online: boolean;
  last_activity: string;
  status: string;
  total_customers: number;
  recent_customers: number;
  total_deals: number;
  closed_deals: number;
  open_deals: number;
  total_revenue: number;
  recent_revenue: number;
  average_deal_value: number;
  total_appointments: number;
  recent_appointments: number;
  conversion_rate: number;
  performance_score: number;
}

interface TeamPerformance {
  summary: {
    total_sales_users: number;
    online_users: number;
    active_users: number;
    total_revenue: number;
    total_customers: number;
    total_deals: number;
  };
  performance_data: SalesPerson[];
}

export default function ManagerSalesTeamPage() {
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<SalesPerson | null>(null);
  
  // Debug: Log current user info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user;
    console.log('👤 Current user:', user);
    console.log('🔑 User role:', user?.role);
    console.log('🏢 User tenant:', user?.tenant);
    console.log('🏪 User store:', user?.store);
  }, []);

  useEffect(() => {
    fetchTeamPerformance();
  }, []);

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching team performance...');
      console.log('📡 API URL: /users/sales-team/performance/');
      
      const response = await apiService.get('/users/sales-team/performance/');
      console.log('📡 API Response:', response);
      
      if (response.success) {
        console.log('✅ Success! Setting team performance data:', response.data);
        setTeamPerformance(response.data);
      } else {
        console.log('❌ API returned error:', response.message);
        setError(response.message || 'Failed to fetch team performance');
      }
    } catch (error) {
      console.error('💥 Error fetching team performance:', error);
      setError('Failed to fetch team performance');
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

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getOnlineStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTeamPerformance} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!teamPerformance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No team performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sales Team</h1>
          <p className="text-gray-600 mt-2">
            Monitor your store's sales team performance
          </p>
        </div>
        <Button onClick={fetchTeamPerformance} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance.summary.total_sales_users}</div>
            <p className="text-xs text-muted-foreground">
              {teamPerformance.summary.active_users} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(teamPerformance.summary.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated by team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance.summary.total_customers}</div>
            <p className="text-xs text-muted-foreground">
              Acquired by team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance.summary.online_users}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamPerformance.performance_data.map((member) => (
              <Card 
                key={member.user_id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedSalesPerson(member)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-white">
                          {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.full_name}</CardTitle>
                        <CardDescription className="text-sm">
                          @{member.username}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getOnlineStatusColor(member.is_online)}
                    >
                      {member.is_online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Store Info */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Store className="h-4 w-4" />
                    <span>{member.store_name || 'No store assigned'}</span>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {member.total_customers}
                      </div>
                      <div className="text-xs text-gray-500">Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(member.total_revenue)}
                      </div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>

                  {/* Performance Score */}
                  <div className="text-center">
                    <Badge 
                      variant="secondary" 
                      className={`${getPerformanceColor(member.performance_score)} px-3 py-1`}
                    >
                      <Trophy className="w-3 h-3 mr-1" />
                      Score: {member.performance_score}/100
                    </Badge>
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Last active: {formatDate(member.last_activity)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Rankings</CardTitle>
              <CardDescription>
                Your sales team members ranked by performance score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Rank</th>
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Customers</th>
                      <th className="text-left py-3 px-4 font-medium">Deals</th>
                      <th className="text-left py-3 px-4 font-medium">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium">Conversion</th>
                      <th className="text-left py-3 px-4 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.performance_data.map((member, index) => (
                      <tr key={member.user_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {index < 3 && (
                              <Trophy className={`w-4 h-4 mr-2 ${
                                index === 0 ? 'text-yellow-500' : 
                                index === 1 ? 'text-gray-400' : 'text-orange-500'
                              }`} />
                            )}
                            <span className="font-medium">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{member.full_name}</td>
                        <td className="py-3 px-4">{member.total_customers}</td>
                        <td className="py-3 px-4">{member.total_deals}</td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(member.total_revenue)}
                        </td>
                        <td className="py-3 px-4">{member.conversion_rate}%</td>
                        <td className="py-3 px-4">
                          <Badge className={getPerformanceColor(member.performance_score)}>
                            {member.performance_score}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>
                  Revenue contribution by team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.performance_data
                    .sort((a, b) => b.total_revenue - a.total_revenue)
                    .map((member) => {
                      const percentage = teamPerformance.summary.total_revenue > 0 
                        ? (member.total_revenue / teamPerformance.summary.total_revenue) * 100 
                        : 0;
                      
                      return (
                        <div key={member.user_id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{member.full_name}</span>
                            <span className="font-medium">
                              {formatCurrency(member.total_revenue)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Insights</CardTitle>
                <CardDescription>
                  Key performance indicators for your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Top Performer</span>
                    <span className="font-medium">
                      {teamPerformance.performance_data[0]?.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Highest Revenue</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(Math.max(...teamPerformance.performance_data.map(m => m.total_revenue)))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Customers</span>
                    <span className="font-medium">
                      {Math.max(...teamPerformance.performance_data.map(m => m.total_customers))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Best Conversion</span>
                    <span className="font-medium text-blue-600">
                      {Math.max(...teamPerformance.performance_data.map(m => m.conversion_rate))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sales Person Detail Modal */}
      {selectedSalesPerson && (
        <SalesPersonDetailModal
          salesPerson={selectedSalesPerson}
          onClose={() => setSelectedSalesPerson(null)}
        />
      )}
    </div>
  );
}

// Sales Person Detail Modal Component
interface SalesPersonDetailModalProps {
  salesPerson: SalesPerson;
  onClose: () => void;
}

function SalesPersonDetailModal({ salesPerson, onClose }: SalesPersonDetailModalProps) {
  const [detailedProfile, setDetailedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDetailedProfile();
  }, [salesPerson]);

  const fetchDetailedProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/users/sales-team/${salesPerson.user_id}/profile/`);
      if (response.success) {
        setDetailedProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching detailed profile:', error);
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

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{salesPerson.full_name}'s Profile</h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading detailed profile...</p>
            </div>
          ) : detailedProfile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={detailedProfile.profile.profile_picture} />
                      <AvatarFallback className="bg-primary text-white text-xl">
                        {salesPerson.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{salesPerson.full_name}</CardTitle>
                      <CardDescription>
                        {detailedProfile.profile.store_name} • {detailedProfile.profile.tenant_name}
                      </CardDescription>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={salesPerson.is_online ? "default" : "secondary"}>
                          {salesPerson.is_online ? 'Online' : 'Offline'}
                        </Badge>
                        <Badge variant="outline">
                          Performance Score: {detailedProfile.metrics.performance.performance_score}/100
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedProfile.metrics.customers.total_customers}
                    </div>
                    <p className="text-xs text-gray-500">
                      +{detailedProfile.metrics.customers.customers_30_days} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(detailedProfile.metrics.revenue.total_revenue)}
                    </div>
                    <p className="text-xs text-gray-500">
                      +{formatCurrency(detailedProfile.metrics.revenue.revenue_30_days)} this month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {detailedProfile.metrics.deals.total_deals}
                    </div>
                    <p className="text-xs text-gray-500">
                      {detailedProfile.metrics.deals.closed_won_deals} closed won
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {detailedProfile.metrics.performance.conversion_rate}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Deal success rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest customer and deal activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detailedProfile.recent_activities.length > 0 ? (
                    <div className="space-y-3">
                      {detailedProfile.recent_activities.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'customer_created' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="font-medium">{activity.title}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(activity.date).toLocaleDateString()}
                            </div>
                          </div>
                          {activity.value && (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(activity.value)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load detailed profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
