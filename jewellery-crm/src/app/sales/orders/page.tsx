'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiService, Sale } from '@/lib/api-service';
import { Download, MoreVertical, Search, Plus, Eye } from 'lucide-react';

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Sale[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders based on search term and status
    let filtered = orders || [];
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.toString().includes(searchTerm)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    // Calculate stats from orders
    const ordersArray = orders || [];
    const totalOrders = ordersArray.length;
    const pendingOrders = ordersArray.filter(order => order.status === 'pending').length;
    const completedOrders = ordersArray.filter(order => order.status === 'delivered').length;
    const cancelledOrders = ordersArray.filter(order => order.status === 'cancelled').length;
    const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    setStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    });
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSales();
      console.log('Orders API response:', response);
      
      // Ensure we have an array of orders
      const ordersData = Array.isArray(response.data) ? response.data : [];
      console.log('Processed orders data:', ordersData);
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
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
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'outline';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'default';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'partial':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleViewOrder = (order: Sale) => {
    // This would navigate to order detail page
    console.log('Viewing order:', order);
    // In a real implementation, this would navigate to order detail
  };

  const handleCreateOrder = () => {
    // This would navigate to create order page
    console.log('Creating new order');
    // In a real implementation, this would navigate to create order
  };

  const exportOrders = async () => {
    try {
      // This would export orders data
      console.log('Exporting orders');
      // In a real implementation, this would call an export API
    } catch (error) {
      console.error('Error exporting orders:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
            <p className="text-text-secondary mt-1">Create new orders and view past ones</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex flex-col gap-1 p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-1">Create new orders and view past ones</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button className="btn-primary" size="sm" onClick={handleCreateOrder}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
          <Button variant="outline" size="sm" onClick={exportOrders}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.totalOrders}</div>
          <div className="text-sm text-text-secondary font-medium">Total Orders</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-orange-600">{stats.pendingOrders}</div>
          <div className="text-sm text-text-secondary font-medium">Pending</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-green-600">{stats.completedOrders}</div>
          <div className="text-sm text-text-secondary font-medium">Completed</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{formatCurrency(stats.totalRevenue)}</div>
          <div className="text-sm text-text-secondary font-medium">Total Revenue</div>
        </Card>
      </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by order ID or customer..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary font-mono">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      Customer #{order.client}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-xs">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getPaymentStatusBadgeVariant(order.payment_status)} className="capitalize text-xs">
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {order.created_at ? formatDate(order.created_at) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    {orders.length === 0 ? 'No orders found' : 'No orders match your search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length > 0 && (
          <div className="text-sm text-text-secondary text-center py-2">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        )}
      </Card>
    </div>
  );
}