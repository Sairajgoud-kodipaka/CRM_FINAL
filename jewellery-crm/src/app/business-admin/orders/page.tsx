'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, MoreVertical, Search, Filter, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface Sale {
  id: number;
  order_number: string;
  client: number;
  sales_representative: number;
  status: string;
  payment_status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  shipping_address?: string;
  shipping_method?: string;
  shipping_cost: number;
  tracking_number?: string;
  notes?: string;
  internal_notes?: string;
  tenant: number;
  created_at: string;
  updated_at: string;
  order_date: string;
  delivery_date?: string;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSales({
        page: currentPage,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.success) {
        const data = response.data as any;
        const ordersData = Array.isArray(data) ? data : data.results || [];
        setOrders(ordersData);
        
        // Calculate stats
        const totalOrders = ordersData.length;
        const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
        const completedOrders = ordersData.filter(order => order.status === 'completed').length;
        const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length;
        
        setStats({
          total_orders: totalOrders,
          pending_orders: pendingOrders,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
      shipped: { color: 'bg-purple-100 text-purple-800', text: 'Shipped' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', text: status };
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-1">View and manage all orders for your business</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
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

      {/* Table Controls */}
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="font-semibold text-text-primary">
            Orders <span className="text-text-muted font-normal">Total: {orders.length} orders</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export CSV</Button>
            <Button variant="outline" size="sm">Export JSON</Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by order ID or customer..." 
              className="w-full md:w-80 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">{order.order_number}</td>
                    <td className="px-4 py-2 text-text-primary">Client {order.client}</td>
                    <td className="px-4 py-2">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-2 text-text-primary">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-2 text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
 
 