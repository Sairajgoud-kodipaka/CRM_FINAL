'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  ArrowLeft,
  Download,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface BillingData {
  total_revenue: number;
  monthly_revenue: number;
  active_subscriptions: number;
  pending_payments: number;
  revenue_growth: number;
  subscription_plans: {
    basic: number;
    professional: number;
    enterprise: number;
  };
  recent_transactions: Array<{
    id: number;
    tenant_name: string;
    amount: number;
    plan: string;
    status: string;
    date: string;
  }>;
}

export default function PlatformBillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: BillingData = {
      total_revenue: 2500000, // 25L
      monthly_revenue: 450000, // 4.5L
      active_subscriptions: 6,
      pending_payments: 2,
      revenue_growth: 12.5,
      subscription_plans: {
        basic: 1,
        professional: 4,
        enterprise: 1
      },
      recent_transactions: [
        {
          id: 1,
          tenant_name: 'Mandeep Jewelries',
          amount: 15000,
          plan: 'Professional',
          status: 'paid',
          date: '2025-08-01'
        },
        {
          id: 2,
          tenant_name: 'Sairaj Jewelries',
          amount: 25000,
          plan: 'Enterprise',
          status: 'paid',
          date: '2025-07-28'
        },
        {
          id: 3,
          tenant_name: 'Abhinav Jewelries',
          amount: 8000,
          plan: 'Basic',
          status: 'pending',
          date: '2025-07-25'
        },
        {
          id: 4,
          tenant_name: 'Chinmay Jewelries',
          amount: 15000,
          plan: 'Professional',
          status: 'paid',
          date: '2025-07-20'
        }
      ]
    };
    
    setBillingData(mockData);
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="default" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Billing Overview"
        subtitle="Monitor platform revenue and subscription management"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading billing data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!billingData) {
    return (
      <DashboardLayout
        title="Billing Overview"
        subtitle="Monitor platform revenue and subscription management"
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No billing data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Billing Overview"
      subtitle="Monitor platform revenue and subscription management"
      actions={
        <div className="flex items-center space-x-2">
          <Link href="/platform/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CardContainer className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(billingData.total_revenue)}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{billingData.revenue_growth}% this month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(billingData.monthly_revenue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Current month</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              <p className="text-3xl font-bold text-foreground">{billingData.active_subscriptions}</p>
              <p className="text-sm text-muted-foreground mt-1">Paying tenants</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
              <p className="text-3xl font-bold text-foreground">{billingData.pending_payments}</p>
              <p className="text-sm text-yellow-600 font-medium mt-1 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Requires attention
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscription Plans Distribution */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Subscription Plans</h3>
              <p className="text-sm text-muted-foreground">Distribution across plans</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Basic Plan</p>
                  <p className="text-sm text-muted-foreground">₹8,000/month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{billingData.subscription_plans.basic}</p>
                <p className="text-xs text-muted-foreground">tenants</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Professional Plan</p>
                  <p className="text-sm text-muted-foreground">₹15,000/month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{billingData.subscription_plans.professional}</p>
                <p className="text-xs text-muted-foreground">tenants</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">Enterprise Plan</p>
                  <p className="text-sm text-muted-foreground">₹25,000/month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{billingData.subscription_plans.enterprise}</p>
                <p className="text-xs text-muted-foreground">tenants</p>
              </div>
            </div>
          </div>
        </CardContainer>

        {/* Recent Transactions */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest payment activities</p>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {billingData.recent_transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.tenant_name}</p>
                    <p className="text-sm text-muted-foreground">{transaction.plan} Plan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(transaction.status)}
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContainer>
      </div>

      {/* Revenue Chart Placeholder */}
      <CardContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Revenue Trends</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 12 Months
            </Button>
          </div>
        </div>
        
        <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Revenue chart will be displayed here</p>
            <p className="text-sm text-muted-foreground">Chart integration coming soon</p>
          </div>
        </div>
      </CardContainer>
    </DashboardLayout>
  );
}
 
 