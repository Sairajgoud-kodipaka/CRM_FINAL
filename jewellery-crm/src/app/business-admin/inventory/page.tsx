'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import AuthGuard from '@/components/auth/AuthGuard';

interface Product {
  id: number;
  name: string;
  sku: string;
  category?: number;
  category_name?: string;
  brand?: string;
  cost_price: number;
  selling_price: number;
  discount_price?: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  weight?: number;
  dimensions?: string;
  material?: string;
  color?: string;
  size?: string;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
  main_image?: string;
  additional_images: string[];
  created_at: string;
  updated_at: string;
  is_in_stock?: boolean;
  is_low_stock?: boolean;
  current_price?: number;
  profit_margin?: number;
  variant_count?: number;
}

interface InventoryStats {
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  inventory_value: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock: 0,
    out_of_stock: 0,
    inventory_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, statusFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        search: searchTerm || undefined,
      });
      
      if (response.success) {
        const data = response.data as any;
        const productsData = Array.isArray(data) ? data : data.results || [];
        setProducts(productsData);
        
        // Calculate stats
        const totalItems = productsData.length;
        const lowStock = productsData.filter((product: Product) => product.quantity <= product.min_quantity && product.quantity > 0).length;
        const outOfStock = productsData.filter((product: Product) => product.quantity === 0).length;
        const inventoryValue = productsData.reduce((sum: number, product: Product) => sum + (product.cost_price * product.quantity), 0);
        
        setStats({
          total_items: totalItems,
          low_stock: lowStock,
          out_of_stock: outOfStock,
          inventory_value: inventoryValue,
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setProducts([]);
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

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'out of stock', color: 'bg-red-100 text-red-800' };
    if (product.quantity <= product.min_quantity) return { status: 'low stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'in stock', color: 'bg-green-100 text-green-800' };
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (statusFilter !== 'all') {
      filtered = products.filter(product => {
        const stockStatus = getStockStatus(product);
        return stockStatus.status === statusFilter;
      });
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading inventory...</span>
        </div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <AuthGuard requiredRole="business_admin">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Inventory</h1>
            <p className="text-text-secondary mt-1">Track and manage your product inventory</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{stats.total_items}</div>
            <div className="text-sm text-text-secondary font-medium">Total Items</div>
          </Card>
          <Card className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{stats.low_stock}</div>
            <div className="text-sm text-text-secondary font-medium">Low Stock</div>
          </Card>
          <Card className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{stats.out_of_stock}</div>
            <div className="text-sm text-text-secondary font-medium">Out of Stock</div>
          </Card>
          <Card className="flex flex-col gap-1 p-5">
            <div className="text-xl font-bold text-text-primary">{formatCurrency(stats.inventory_value)}</div>
            <div className="text-sm text-text-secondary font-medium">Inventory Value</div>
          </Card>
        </div>

        {/* Table Controls */}
        <Card className="p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product or SKU..." 
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
                <SelectItem value="in stock">In Stock</SelectItem>
                <SelectItem value="low stock">Low Stock</SelectItem>
                <SelectItem value="out of stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Product</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">SKU</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Stock</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Value</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <tr key={product.id} className="border-t border-border hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-text-primary">{product.name}</td>
                        <td className="px-4 py-2 text-text-primary">{product.sku}</td>
                        <td className="px-4 py-2 text-text-primary">{product.quantity}</td>
                        <td className="px-4 py-2">
                          <Badge className={stockStatus.color}>
                            {stockStatus.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-text-primary">
                          {formatCurrency(product.cost_price * product.quantity)}
                        </td>
                        <td className="px-4 py-2 text-text-secondary">{formatDate(product.updated_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}
 
 