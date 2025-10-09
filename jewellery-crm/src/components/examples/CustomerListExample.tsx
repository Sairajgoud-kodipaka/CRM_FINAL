/**
 * Example Integration: ResponsiveTable Usage
 * 
 * This example shows how to integrate the ResponsiveTable component
 * into an existing customer list page, replacing the current table implementation.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Calendar, User, Filter, Download } from 'lucide-react';
import { ResponsiveTable, ResponsiveColumn } from '@/components/ui/ResponsiveTable';

// Sample data type (replace with your actual data structure)
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  priority: 'high' | 'medium' | 'low';
  location: string;
  lastContact: string;
  tags: string[];
  totalOrders: number;
  totalValue: number;
}

// Sample data
const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    status: 'active',
    priority: 'high',
    location: 'New York, NY',
    lastContact: '2024-01-15',
    tags: ['VIP', 'Gold Member'],
    totalOrders: 15,
    totalValue: 25000,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 987-6543',
    status: 'pending',
    priority: 'medium',
    location: 'Los Angeles, CA',
    lastContact: '2024-01-10',
    tags: ['New Customer'],
    totalOrders: 3,
    totalValue: 5000,
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'm.brown@email.com',
    phone: '+1 (555) 456-7890',
    status: 'active',
    priority: 'low',
    location: 'Chicago, IL',
    lastContact: '2024-01-12',
    tags: ['Regular', 'Bulk Buyer'],
    totalOrders: 8,
    totalValue: 12000,
  },
];

export default function CustomerListExample() {
  const [customers] = useState<Customer[]>(sampleCustomers);
  const [loading, setLoading] = useState(false);

  // Define columns with responsive priorities
  const columns: ResponsiveColumn<Customer>[] = [
    {
      key: 'name',
      title: 'Customer Name',
      priority: 'high',
      sortable: true,
      mobileLabel: 'Customer',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Phone',
      priority: 'high',
      sortable: true,
      mobileLabel: 'Phone',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      priority: 'high',
      sortable: true,
      mobileLabel: 'Status',
      render: (value) => (
        <Badge 
          variant={value === 'active' ? 'default' : value === 'pending' ? 'secondary' : 'outline'}
          className={
            value === 'active' ? 'bg-green-100 text-green-800 border-green-300' :
            value === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      priority: 'medium',
      sortable: true,
      mobileLabel: 'Priority',
      render: (value) => (
        <Badge 
          variant="outline"
          className={
            value === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
            value === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'location',
      title: 'Location',
      priority: 'medium',
      sortable: true,
      mobileLabel: 'Location',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'lastContact',
      title: 'Last Contact',
      priority: 'low',
      sortable: true,
      mobileLabel: 'Last Contact',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      title: 'Orders',
      priority: 'low',
      sortable: true,
      mobileLabel: 'Orders',
      render: (value) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground">orders</div>
        </div>
      ),
    },
    {
      key: 'totalValue',
      title: 'Total Value',
      priority: 'low',
      sortable: true,
      mobileLabel: 'Value',
      render: (value) => (
        <div className="text-right">
          <div className="font-medium">${value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">total</div>
        </div>
      ),
    },
  ];

  // Custom mobile card title and subtitle
  const mobileCardTitle = (customer: Customer) => customer.name;
  const mobileCardSubtitle = (customer: Customer) => customer.email;

  // Custom mobile card actions
  const mobileCardActions = (customer: Customer) => (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation();
          handleCall(customer);
        }}
      >
        <Phone className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation();
          handleEmail(customer);
        }}
      >
        <Mail className="h-3 w-3" />
      </Button>
    </div>
  );

  // Event handlers
  const handleRowSelect = (selectedCustomers: Customer[]) => {
    console.log('Selected customers:', selectedCustomers);
  };

  const handleRowClick = (customer: Customer) => {
    console.log('Clicked customer:', customer);
    // Navigate to customer detail page
  };

  const handleAction = (action: string, customer: Customer) => {
    console.log(`${action} action for customer:`, customer);
    // Handle different actions (view, edit, delete)
  };

  const handleCall = (customer: Customer) => {
    console.log('Calling customer:', customer.phone);
    // Implement call functionality
  };

  const handleEmail = (customer: Customer) => {
    console.log('Emailing customer:', customer.email);
    // Implement email functionality
  };

  const handleExport = () => {
    console.log('Exporting customers...');
    // Implement export functionality
  };

  const handleFilter = () => {
    console.log('Opening filter dialog...');
    // Implement filter functionality
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {customers.filter(c => c.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customers.reduce((sum, c) => sum + c.totalValue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Table */}
      <ResponsiveTable
        data={customers}
        columns={columns}
        loading={loading}
        searchable={true}
        selectable={true}
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        onAction={handleAction}
        mobileCardTitle={mobileCardTitle}
        mobileCardSubtitle={mobileCardSubtitle}
        mobileCardActions={mobileCardActions}
        actions={
          <Button variant="outline" size="sm">
            Bulk Actions
          </Button>
        }
        emptyState={
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first customer.
            </p>
            <Button>Add Customer</Button>
          </div>
        }
      />
    </div>
  );
}

