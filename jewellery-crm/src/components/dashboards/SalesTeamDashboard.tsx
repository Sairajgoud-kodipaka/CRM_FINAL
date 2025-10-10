/**
 * Sales Team Dashboard Component
 * 
 * Personal dashboard for sales representatives in jewellery stores.
 * Features personal performance, customer pipeline, and sales tools.
 * 
 * Key Features:
 * - Personal sales performance and targets
 * - Customer pipeline management
 * - Personal appointment calendar
 * - Commission and earnings tracking
 * - Quick customer actions
 * - Product catalog access
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { useSalesDashboard, useSalesPipeline, useAppointments } from '@/hooks/useDashboardData';
import { DashboardSkeleton, KPICardSkeleton, PipelineItemSkeleton, AppointmentItemSkeleton, QuickActionSkeleton } from '@/components/ui/skeleton';
import { 
  DashboardLayout, 
  CardContainer,
} from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User,
  Target, 
  ShoppingBag,
  Calendar,
  Users,
  Heart,
  TrendingUp,
  Phone,
  Plus,
  Eye,
  ArrowUpRight,
  IndianRupee,
  Award,
  Clock,
  Star,
  MessageSquare,
} from 'lucide-react';

/**
 * Sales representative metrics interface
 */
interface SalesMetrics {
  personal: {
    name: string;
    monthlyTarget: number;
    achieved: number;
    commission: number;
    rank: number;
    totalReps: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    appointments: number;
    followUps: number;
  };
  performance: {
    conversionRate: number;
    avgDealSize: number;
    customerSatisfaction: number;
  };
}

/**
 * Customer pipeline interface
 */
interface CustomerPipeline {
  id: number;
  name: string;
  stage: string;
  value: number;
  probability: number;
  lastContact: string;
  nextAction: string;
  phone: string;
  avatar: string | null;
}

/**
 * Appointment interface
 */
interface Appointment {
  id: number;
  customer: string;
  time: string;
  type: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

/**
 * Achievement interface
 */
interface Achievement {
  id: number;
  title: string;
  description: string;
  amount?: number;
  date: string;
  icon: string;
}

/**
 * Sales Team Dashboard Component
 */
export const SalesTeamDashboard = React.memo(function SalesTeamDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // React Query hooks for data fetching
  const { 
    data: salesData, 
    isLoading: salesLoading, 
    error: salesError 
  } = useSalesDashboard();

  const { 
    data: pipelineData, 
    isLoading: pipelineLoading 
  } = useSalesPipeline();

  const { 
    data: appointmentsData, 
    isLoading: appointmentsLoading 
  } = useAppointments();

  // Derived state from React Query data
  const salesMetrics = React.useMemo((): SalesMetrics | null => {
    if (!salesData) return null;
    
    return {
      personal: {
        name: user?.name || 'Sales Representative',
        monthlyTarget: 200000,
        achieved: salesData.monthly_revenue || 0,
        commission: (salesData.monthly_revenue || 0) * 0.05,
        rank: 1,
        totalReps: 1,
      },
      customers: {
        total: salesData.total_customers || 0,
        newThisMonth: 0,
        appointments: 0,
        followUps: 0,
      },
      performance: {
        conversionRate: salesData.conversion_rate || 0,
        avgDealSize: salesData.avg_deal_size || 0,
        customerSatisfaction: 4.8,
      },
    };
  }, [salesData, user]);

  const customerPipeline = React.useMemo((): CustomerPipeline[] => {
    if (!pipelineData || !Array.isArray(pipelineData)) return [];
    
    return pipelineData.slice(0, 4).map((pipeline: any) => ({
      id: pipeline.id,
      name: pipeline.client_name || 'Customer',
      stage: pipeline.stage || 'Unknown',
      value: pipeline.expected_value || 0,
      probability: pipeline.probability || 0,
      lastContact: pipeline.updated_at ? new Date(pipeline.updated_at).toLocaleDateString() : 'Unknown',
      nextAction: pipeline.next_action || 'Follow up',
      phone: pipeline.client_phone || '',
      avatar: null,
    }));
  }, [pipelineData]);

  const upcomingAppointments = React.useMemo((): Appointment[] => {
    if (!appointmentsData || !Array.isArray(appointmentsData)) return [];
    
    return appointmentsData.slice(0, 3).map((appointment: any) => ({
      id: appointment.id,
      customer: appointment.client_name || 'Customer',
      time: appointment.date ? new Date(appointment.date).toLocaleString() : 'TBD',
      type: appointment.purpose || 'Meeting',
      location: appointment.location || 'Store',
      status: appointment.status || 'pending',
    }));
  }, [appointmentsData]);

  const recentAchievements = React.useMemo((): Achievement[] => {
    if (!salesData) return [];
    
    const achievements: Achievement[] = [];
    if (salesData.sales_count > 0) {
      achievements.push({
        id: 1,
        title: 'Deal Closed',
        description: `Completed ${salesData.sales_count} sales this month`,
        amount: salesData.monthly_revenue,
        date: 'This month',
        icon: 'trophy',
      });
    }
    if (salesData.total_customers > 0) {
      achievements.push({
        id: 2,
        title: 'New Customer',
        description: `Added ${salesData.total_customers} customers`,
        date: 'This month',
        icon: 'user',
      });
    }
    return achievements;
  }, [salesData]);

  // Loading and error states
  const isLoading = salesLoading || pipelineLoading || appointmentsLoading;
  const error = salesError?.message || null;


  // Navigation handlers for buttons
  const handleMyCalendar = () => {
    router.push('/sales/calendar');
  };

  const handleAddCustomer = () => {
    router.push('/sales/customers/new');
  };

  const handleViewAllPipeline = () => {
    router.push('/sales/pipeline');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addCustomer':
        router.push('/sales/customers/new');
        break;
      case 'bookAppointment':
        router.push('/sales/appointments/new');
        break;
      case 'makeCall':
        router.push('/sales/calls/new');
        break;
      case 'sendWhatsApp':
        router.push('/sales/whatsapp/compose');
        break;
      case 'viewCatalog':
        router.push('/sales/catalog');
        break;
      case 'myReports':
        router.push('/sales/reports');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="My Dashboard"
        subtitle="Loading your sales data..."
      >
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="My Dashboard"
        subtitle="Error loading dashboard data"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!salesMetrics) {
    return (
      <DashboardLayout
        title="My Dashboard"
        subtitle="No data available"
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No sales data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle="Track your personal performance and manage your customer relationships"
      actions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleMyCalendar}>
            <Calendar className="w-4 h-4 mr-2" />
            My Calendar
          </Button>
          <Button size="sm" onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      }
    >
      {/* Personal Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Monthly Target Progress */}
        {salesLoading ? (
          <KPICardSkeleton />
        ) : (
          <CardContainer className="border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Target</p>
                <p className="text-3xl font-bold text-foreground">
                  {(((salesMetrics?.personal.achieved || 0) / (salesMetrics?.personal.monthlyTarget || 1)) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                  <IndianRupee className="w-3 h-3 mr-1" />
                  {((salesMetrics?.personal.achieved || 0) / 100000).toFixed(1)}L achieved
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContainer>
        )}

        {/* Commission Earned */}
        {salesLoading ? (
          <KPICardSkeleton />
        ) : (
          <CardContainer className="border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-3xl font-bold text-foreground flex items-center">
                  <IndianRupee className="w-6 h-6 mr-1" />
                  {((salesMetrics?.personal.commission || 0) / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This month
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContainer>
        )}

        {/* My Customers */}
        {salesLoading ? (
          <KPICardSkeleton />
        ) : (
          <CardContainer className="border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Customers</p>
                <p className="text-3xl font-bold text-foreground">{salesMetrics?.customers.total || 0}</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  +{salesMetrics?.customers.newThisMonth || 0} new this month
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContainer>
        )}

        {/* Team Ranking */}
        {salesLoading ? (
          <KPICardSkeleton />
        ) : (
          <CardContainer className="border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Ranking</p>
                <p className="text-3xl font-bold text-foreground">
                  #{salesMetrics?.personal.rank || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  out of {salesMetrics?.personal.totalReps || 0} reps
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Customer Pipeline */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">My Customer Pipeline</h3>
              <p className="text-sm text-muted-foreground">Active deals and opportunities</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewAllPipeline}>
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {pipelineLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <PipelineItemSkeleton key={i} />
              ))
            ) : (
              customerPipeline.map((customer) => (
              <div key={customer.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={customer.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">Last contact: {customer.lastContact}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground flex items-center">
                      <IndianRupee className="w-4 h-4 mr-1" />
                      {(customer.value / 1000).toFixed(0)}K
                    </p>
                    <Badge variant="secondary">{customer.stage}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deal Probability</span>
                    <span className="font-medium">{customer.probability}%</span>
                  </div>
                  <Progress value={customer.probability} className="h-2" />
                  <p className="text-sm text-foreground font-medium">Next: {customer.nextAction}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="w-3 h-3 mr-2" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="w-3 h-3 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContainer>

        {/* Upcoming Appointments */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">My Appointments</h3>
              <p className="text-sm text-muted-foreground">{upcomingAppointments.length} upcoming meetings</p>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schedule New
            </Button>
          </div>

          <div className="space-y-4">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <AppointmentItemSkeleton key={i} />
              ))
            ) : (
              upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{appointment.customer}</p>
                    <p className="text-sm text-muted-foreground">{appointment.type}</p>
                    <p className="text-xs text-muted-foreground">{appointment.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{appointment.time}</p>
                  <Badge 
                    variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContainer>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Target Progress */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Target Progress</h3>
              <p className="text-sm text-muted-foreground">Monthly sales goal</p>
            </div>
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {((salesMetrics.personal.achieved / salesMetrics.personal.monthlyTarget) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">of target achieved</p>
            </div>
            <Progress 
              value={(salesMetrics.personal.achieved / salesMetrics.personal.monthlyTarget) * 100} 
              className="h-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{(salesMetrics.personal.achieved / 100000).toFixed(1)}L</span>
              <span>₹{(salesMetrics.personal.monthlyTarget / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </CardContainer>

        {/* Performance Metrics */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance</h3>
              <p className="text-sm text-muted-foreground">Key metrics</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold text-green-600">{salesMetrics.performance.conversionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Deal Size</span>
              <span className="font-semibold flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                {(salesMetrics.performance.avgDealSize / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Customer Rating</span>
              <span className="font-semibold text-yellow-600 flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {salesMetrics.performance.customerSatisfaction}
              </span>
            </div>
          </div>
        </CardContainer>

        {/* Recent Achievements */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recent Wins</h3>
              <p className="text-sm text-muted-foreground">Latest achievements</p>
            </div>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>
      </div>

      {/* Quick Actions */}
      <CardContainer>
        <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('addCustomer')}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">Add Customer</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('bookAppointment')}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Book Appointment</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('makeCall')}
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs">Make Call</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('sendWhatsApp')}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Send WhatsApp</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('viewCatalog')}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs">View Catalog</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => handleQuickAction('myReports')}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">My Reports</span>
          </Button>
        </div>
      </CardContainer>
    </DashboardLayout>
  );
});
