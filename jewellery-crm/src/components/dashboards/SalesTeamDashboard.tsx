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
 * Mock data for sales representative metrics
 */
const salesMetrics = {
  personal: {
    name: 'Sales Representative',
    monthlyTarget: 200000,
    achieved: 175000,
    commission: 8750,
    rank: 3,
    totalReps: 15,
  },
  customers: {
    total: 31,
    newThisMonth: 4,
    appointments: 6,
    followUps: 8,
  },
  performance: {
    conversionRate: 68.5,
    avgDealSize: 45000,
    customerSatisfaction: 4.8,
  },
};

/**
 * Customer pipeline data
 */
const customerPipeline = [
  {
    id: 1,
    name: 'Mrs. Aditi Patel',
    stage: 'Exhibition',
    value: 125000,
    probability: 85,
    lastContact: '2 days ago',
    nextAction: 'Follow up on custom design',
    phone: '+91 98765 43210',
    avatar: null,
  },
  {
    id: 2,
    name: 'Mr. Vikram Singh',
    stage: 'Negotiation',
    value: 85000,
    probability: 70,
    lastContact: '1 day ago',
    nextAction: 'Discuss pricing options',
    phone: '+91 87654 32109',
    avatar: null,
  },
  {
    id: 3,
    name: 'Ms. Kavya Nair',
    stage: 'Qualified',
    value: 65000,
    probability: 60,
    lastContact: '3 days ago',
    nextAction: 'Show earring collection',
    phone: '+91 76543 21098',
    avatar: null,
  },
  {
    id: 4,
    name: 'Mrs. Sunita Sharma',
    stage: 'Store - Walkin',
    value: 45000,
    probability: 30,
    lastContact: '1 week ago',
    nextAction: 'Schedule consultation',
    phone: '+91 65432 10987',
    avatar: null,
  },
];

/**
 * Upcoming appointments
 */
const upcomingAppointments = [
  {
    id: 1,
    customer: 'Mrs. Aditi Patel',
    time: 'Today, 2:00 PM',
    type: 'Design Review',
    location: 'Store',
    status: 'confirmed',
  },
  {
    id: 2,
    customer: 'Mr. Rajesh Kumar',
    time: 'Tomorrow, 11:00 AM',
    type: 'Wedding Collection',
    location: 'Store',
    status: 'confirmed',
  },
  {
    id: 3,
    customer: 'Ms. Priya Gupta',
    time: 'Tomorrow, 4:00 PM',
    type: 'Ring Sizing',
    location: 'Store',
    status: 'pending',
  },
];

/**
 * Recent achievements
 */
const recentAchievements = [
  {
    id: 1,
    title: 'Deal Closed',
    description: 'Sold diamond necklace set to Mrs. Sharma',
    amount: 125000,
    date: 'Today',
    icon: 'trophy',
  },
  {
    id: 2,
    title: 'New Customer',
    description: 'Successfully onboarded Mr. Patel',
    date: 'Yesterday',
    icon: 'user',
  },
  {
    id: 3,
    title: 'Target Milestone',
    description: 'Achieved 75% of monthly target',
    date: '2 days ago',
    icon: 'target',
  },
];

/**
 * Sales Team Dashboard Component
 */
export function SalesTeamDashboard() {
  const router = useRouter();

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
        <CardContainer className="border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Target</p>
              <p className="text-3xl font-bold text-foreground">
                {((salesMetrics.personal.achieved / salesMetrics.personal.monthlyTarget) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                {(salesMetrics.personal.achieved / 100000).toFixed(1)}L achieved
              </p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </CardContainer>

        {/* Commission Earned */}
        <CardContainer className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
              <p className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1" />
                {(salesMetrics.personal.commission / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This month
              </p>
            </div>
            <Award className="h-8 w-8 text-green-500" />
          </div>
        </CardContainer>

        {/* My Customers */}
        <CardContainer className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">My Customers</p>
              <p className="text-3xl font-bold text-foreground">{salesMetrics.customers.total}</p>
              <p className="text-sm text-green-600 font-medium mt-1">
                +{salesMetrics.customers.newThisMonth} new this month
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContainer>

        {/* Team Ranking */}
        <CardContainer className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team Ranking</p>
              <p className="text-3xl font-bold text-foreground">
                #{salesMetrics.personal.rank}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                out of {salesMetrics.personal.totalReps} reps
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </CardContainer>
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
            {customerPipeline.map((customer) => (
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
            ))}
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
            {upcomingAppointments.map((appointment) => (
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
            ))}
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
}