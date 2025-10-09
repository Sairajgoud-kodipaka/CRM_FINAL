/**
 * Responsive Components Integration Example
 * 
 * This file demonstrates how to integrate all the responsive components
 * into your CRM application for a fully mobile-responsive experience.
 */

'use client';

import React, { useState } from 'react';
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';
import { ResponsiveFormLayout, FormSection, FormField } from '@/components/ui/ResponsiveFormLayout';
import { EnhancedMobileNav } from '@/components/navigation/EnhancedMobileNav';
import { MobileDashboard, DashboardSection, DashboardMetric, QuickAction } from '@/components/dashboard/MobileDashboard';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { ResponsiveCard } from '@/components/ui/ResponsiveCard';
import { TouchOptimizedButton } from '@/components/ui/TouchOptimizedButton';
import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Phone, Calendar, Package, TrendingUp, Eye, Edit, Trash2 } from 'lucide-react';

// Sample data types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  priority: 'high' | 'medium' | 'low';
  location: string;
  lastContact: string;
  totalOrders: number;
  totalValue: number;
}

// Sample data
const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    status: 'active',
    priority: 'high',
    location: 'New York',
    lastContact: '2024-01-15',
    totalOrders: 5,
    totalValue: 2500,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-0124',
    status: 'pending',
    priority: 'medium',
    location: 'California',
    lastContact: '2024-01-14',
    totalOrders: 2,
    totalValue: 1200,
  },
  // Add more sample data...
];

export default function ResponsiveIntegrationExample() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Define table columns
  const customerColumns: ResponsiveColumn<Customer>[] = [
    {
      key: 'name',
      title: 'Customer',
      priority: 'high',
      mobileLabel: 'Name',
      render: (value) => (
        <span className="font-medium text-foreground">{value as string}</span>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      priority: 'high',
      mobileLabel: 'Email',
      render: (value) => (
        <span className="text-sm text-muted-foreground">{value as string}</span>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      priority: 'medium',
      mobileLabel: 'Phone',
      render: (value) => (
        <span className="text-sm text-muted-foreground">{value as string}</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      priority: 'high',
      mobileLabel: 'Status',
      render: (value) => {
        const status = value as string;
        const statusColors = {
          active: 'bg-green-100 text-green-800 border-green-300',
          inactive: 'bg-red-100 text-red-800 border-red-300',
          pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        };
        return (
          <Badge 
            variant="outline" 
            className={statusColors[status as keyof typeof statusColors]}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'priority',
      title: 'Priority',
      priority: 'medium',
      mobileLabel: 'Priority',
      render: (value) => {
        const priority = value as string;
        const priorityColors = {
          high: 'bg-red-100 text-red-800 border-red-300',
          medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          low: 'bg-gray-100 text-gray-800 border-gray-300',
        };
        return (
          <Badge 
            variant="outline"
            className={priorityColors[priority as keyof typeof priorityColors]}
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      key: 'totalValue',
      title: 'Total Value',
      priority: 'low',
      mobileLabel: 'Value',
      render: (value) => (
        <span className="font-medium text-foreground">
          ${(value as number).toLocaleString()}
        </span>
      ),
    },
  ];

  // Define form sections
  const formSections: FormSection[] = [
    {
      title: 'Basic Information',
      description: 'Enter the customer\'s basic details',
      fields: [
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          priority: 'high',
          placeholder: 'Enter full name',
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          priority: 'high',
          placeholder: 'Enter email address',
          mobileType: 'email',
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          required: true,
          priority: 'high',
          placeholder: 'Enter phone number',
          mobileType: 'tel',
        },
      ],
      priority: 'high',
    },
    {
      title: 'Additional Details',
      description: 'Optional information about the customer',
      fields: [
        {
          name: 'location',
          label: 'Location',
          type: 'text',
          priority: 'medium',
          placeholder: 'Enter location',
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          priority: 'low',
          placeholder: 'Enter any additional notes',
        },
      ],
      collapsible: true,
      defaultExpanded: false,
      priority: 'medium',
    },
  ];

  // Define dashboard sections
  const dashboardSections: DashboardSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Key performance indicators',
      metrics: [
        {
          id: 'total-customers',
          title: 'Total Customers',
          value: 1250,
          change: { value: 12, type: 'increase', period: 'last month' },
          format: 'number',
          priority: 'high',
        },
        {
          id: 'active-customers',
          title: 'Active Customers',
          value: 980,
          change: { value: 8, type: 'increase', period: 'last month' },
          format: 'number',
          priority: 'high',
        },
        {
          id: 'total-revenue',
          title: 'Total Revenue',
          value: 125000,
          change: { value: 15, type: 'increase', period: 'last month' },
          format: 'currency',
          priority: 'high',
        },
      ],
      priority: 'high',
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      description: 'Latest customer interactions',
      metrics: [
        {
          id: 'new-leads',
          title: 'New Leads',
          value: 45,
          change: { value: 5, type: 'increase', period: 'this week' },
          format: 'number',
          priority: 'medium',
        },
        {
          id: 'calls-made',
          title: 'Calls Made',
          value: 120,
          change: { value: 2, type: 'decrease', period: 'this week' },
          format: 'number',
          priority: 'medium',
        },
      ],
      collapsible: true,
      defaultExpanded: false,
      priority: 'medium',
    },
  ];

  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'add-customer',
      label: 'Add Customer',
      icon: Plus,
      onClick: () => setShowAddModal(true),
    },
    {
      id: 'make-call',
      label: 'Make Call',
      icon: Phone,
      onClick: () => console.log('Make call'),
    },
    {
      id: 'schedule-appointment',
      label: 'Schedule',
      icon: Calendar,
      onClick: () => console.log('Schedule appointment'),
    },
    {
      id: 'view-analytics',
      label: 'Analytics',
      icon: TrendingUp,
      onClick: () => console.log('View analytics'),
    },
  ];

  // Define quick add items for mobile nav
  const quickAddItems = [
    {
      label: 'Add Customer',
      icon: Plus,
      onClick: () => setShowAddModal(true),
    },
    {
      label: 'Make Call',
      icon: Phone,
      onClick: () => console.log('Make call'),
    },
  ];

  const handleCustomerAction = (action: string, customer: Customer) => {
    switch (action) {
      case 'view':
        setSelectedCustomer(customer);
        setShowDetailModal(true);
        break;
      case 'edit':
        console.log('Edit customer:', customer);
        break;
      case 'delete':
        console.log('Delete customer:', customer);
        break;
    }
  };

  const handleAddCustomer = (data: any) => {
    console.log('Add customer:', data);
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <EnhancedMobileNav
        showSearch={true}
        showQuickAdd={true}
        quickAddItems={quickAddItems}
        onSearch={(query) => console.log('Search:', query)}
      />

      <div className="p-4 space-y-6">
        {/* Dashboard Section */}
        <MobileDashboard
          sections={dashboardSections}
          loading={false}
          onRefresh={() => console.log('Refresh dashboard')}
          quickActions={quickActions}
          showProgress={true}
        />

        {/* Responsive Grid Example */}
        <ResponsiveGrid
          cols={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap="md"
          itemSize="md"
        >
          <ResponsiveCard
            title="Quick Stats"
            description="Overview of key metrics"
            variant="elevated"
            size="md"
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customers</span>
                <span className="font-semibold">1,250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-semibold">$125K</span>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard
            title="Recent Activity"
            description="Latest customer interactions"
            variant="outlined"
            size="md"
          >
            <div className="space-y-2">
              <div className="text-sm">New customer added</div>
              <div className="text-sm">Call completed</div>
              <div className="text-sm">Appointment scheduled</div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard
            title="Quick Actions"
            description="Common tasks"
            variant="default"
            size="md"
          >
            <div className="space-y-2">
              <TouchOptimizedButton
                size="sm"
                fullWidth
                onClick={() => setShowAddModal(true)}
              >
                Add Customer
              </TouchOptimizedButton>
              <TouchOptimizedButton
                size="sm"
                variant="outline"
                fullWidth
                onClick={() => console.log('Make call')}
              >
                Make Call
              </TouchOptimizedButton>
            </div>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Progressive Disclosure Example */}
        <ProgressiveDisclosure
          title="Advanced Settings"
          description="Configure advanced options for your CRM"
          variant="card"
          size="md"
          collapsible={true}
          defaultExpanded={false}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select className="w-full p-2 border rounded-md">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>
        </ProgressiveDisclosure>

        {/* Responsive Table */}
        <ResponsiveTable
          data={sampleCustomers}
          columns={customerColumns}
          loading={false}
          searchable={true}
          selectable={false}
          onRowClick={(customer) => {
            setSelectedCustomer(customer as Customer);
            setShowDetailModal(true);
          }}
          onAction={handleCustomerAction}
          mobileCardTitle={(customer) => (customer as Customer).name}
          mobileCardSubtitle={(customer) => (customer as Customer).email}
          mobileCardActions={(customer) => (
            <div className="flex gap-2">
              <TouchOptimizedButton
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomerAction('view', customer as Customer);
                }}
              >
                <Eye className="h-4 w-4" />
              </TouchOptimizedButton>
              <TouchOptimizedButton
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomerAction('edit', customer as Customer);
                }}
              >
                <Edit className="h-4 w-4" />
              </TouchOptimizedButton>
            </div>
          )}
          emptyState={
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first customer.
              </p>
              <TouchOptimizedButton onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </TouchOptimizedButton>
            </div>
          }
        />
      </div>

      {/* Add Customer Modal */}
      <ResponsiveDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        title="Add New Customer"
        description="Enter the customer's information below"
        size="md"
        onConfirm={handleAddCustomer}
        onCancel={() => setShowAddModal(false)}
        confirmLabel="Add Customer"
        cancelLabel="Cancel"
      >
        <ResponsiveFormLayout
          sections={formSections}
          onSubmit={handleAddCustomer}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Add Customer"
          cancelLabel="Cancel"
        />
      </ResponsiveDialog>

      {/* Customer Detail Modal */}
      <ResponsiveDialog
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        title={selectedCustomer?.name}
        description="Customer details and information"
        size="lg"
        onCancel={() => setShowDetailModal(false)}
        cancelLabel="Close"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <p className="text-foreground">{selectedCustomer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Phone
                </label>
                <p className="text-foreground">{selectedCustomer.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Status
                </label>
                <Badge variant="outline">{selectedCustomer.status}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Priority
                </label>
                <Badge variant="outline">{selectedCustomer.priority}</Badge>
              </div>
            </div>
          </div>
        )}
      </ResponsiveDialog>
    </div>
  );
}
