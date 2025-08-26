'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, MoreVertical, Package } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface Order {
  id: string;
  order_number: string;
  client: {
    first_name: string;
    last_name: string;
  };
  status: string;
  total_amount: number;
  created_at: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when orders endpoint is implemented
      // const response = await apiService.getOrders();
      // if (response.success) {
      //   setOrders(response.data);
      //   calculateStats(response.data);
      // }
      
      // For now, show empty state
      setOrders([]);
      setStats({
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const stats = {
      total_orders: ordersData.length,
      pending_orders: ordersData.filter(o => o.status === 'pending').length,
      completed_orders: ordersData.filter(o => o.status === 'completed').length,
      cancelled_orders: ordersData.filter(o => o.status === 'cancelled').length,
    };
    setStats(stats);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${order.client.first_name} ${order.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-1">View and manage all orders for your store</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.total_orders}</div>
          <div className="text-sm text-text-secondary font-medium">Total Orders</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.pending_orders}</div>
          <div className="text-sm text-text-secondary font-medium">Pending</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.completed_orders}</div>
          <div className="text-sm text-text-secondary font-medium">Completed</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.cancelled_orders}</div>
          <div className="text-sm text-text-secondary font-medium">Cancelled</div>
        </Card>
      </div>

      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <Input 
            placeholder="Search by order ID or customer..." 
            className="w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 text-center max-w-md">
                Orders will appear here once they are created. Start by creating your first order.
              </p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Order ID</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Customer</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Amount</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">{order.order_number}</td>
                    <td className="px-4 py-2 text-text-primary">
                      {order.client.first_name} {order.client.last_name}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-xs">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-text-primary">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-2 text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
