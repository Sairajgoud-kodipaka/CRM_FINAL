'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';
import { apiService, Client } from '@/lib/api-service';

export default function ManagerCustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      // Note: This assumes there's a getClientById method in apiService
      // If not available, you might need to implement it
      const response = await apiService.getClients();
      if (response.success && response.data && Array.isArray(response.data)) {
        const foundCustomer = response.data.find(c => c.id.toString() === customerId);
        setCustomer(foundCustomer || null);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Customer Details</h1>
          <p className="text-text-secondary mt-1">View and manage customer interactions</p>
        </div>
        <Card className="p-6">
          <div className="text-center text-text-muted">
            Customer not found.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Customer Details</h1>
        <p className="text-text-secondary mt-1">View and manage customer interactions</p>
      </div>
      <Card className="p-6 flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-text-primary">{`${customer.first_name} ${customer.last_name}`}</div>
            <div className="text-sm text-text-muted">{customer.customer_type}</div>
            <div className="text-sm text-text-muted">{customer.email} | {customer.phone}</div>
            <div className="text-sm text-text-muted">{`${customer.city || ''}, ${customer.state || ''}`}</div>
            <div className="text-xs text-text-muted">Joined: {new Date(customer.created_at).toLocaleDateString()}</div>
          </div>
          <Badge variant="outline" className="capitalize text-xs h-fit">{customer.status || 'exhibition'}</Badge>
        </div>
      </Card>
      <Tabs defaultValue="interactions" className="w-full">
        <TabsList>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="interactions">
          <Card className="p-4">No recent interactions.</Card>
        </TabsContent>
        <TabsContent value="orders">
          <Card className="p-4">No orders found.</Card>
        </TabsContent>
        <TabsContent value="notes">
          <Card className="p-4">No notes yet.</Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card className="p-4">No activity yet.</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}