'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiService, Product } from '@/lib/api-service';
import AuthGuard from '@/components/auth/AuthGuard';

export default function ManagerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>({
    total_products: 0,
    active_products: 0,
    out_of_stock: 0,
    low_stock: 0,
    total_value: 0,
    category_count: 0,
    recent_products: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await apiService.getProducts();
      if (productsResponse.success && productsResponse.data) {
        // Handle paginated response
        let productsData: Product[] = [];
        if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        } else if (typeof productsResponse.data === 'object' && productsResponse.data !== null) {
          const data = productsResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            productsData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            productsData = data.data;
          }
        }
        setProducts(productsData);
        console.log(`Loaded ${productsData.length} products`);
      } else {
        console.warn('Products response is not valid:', productsResponse.data);
        setProducts([]);
      }

      // Fetch stats
      const statsResponse = await apiService.getProductStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'in stock' && product.quantity > product.min_quantity) ||
                         (statusFilter === 'low stock' && product.quantity > 0 && product.quantity <= product.min_quantity) ||
                         (statusFilter === 'out of stock' && product.quantity === 0);
    
    return matchesSearch && matchesStatus;
  }) : [];

  const statsCards = [
    { label: 'Total Items', value: stats.total_products || 0 },
    { label: 'Low Stock', value: stats.low_stock || 0 },
    { label: 'Out of Stock', value: stats.out_of_stock || 0 },
    { label: 'Inventory Value', value: `₹${((stats.total_value || 0) / 100000).toFixed(1)}L` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <AuthGuard requiredRole="manager">
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Inventory</h1>
          <p className="text-text-secondary mt-1">Track and manage your store's inventory</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((s: any) => (
            <Card key={s.label} className="flex flex-col gap-1 p-5">
              <div className="text-xl font-bold text-text-primary">{s.value}</div>
              <div className="text-sm text-text-secondary font-medium">{s.label}</div>
            </Card>
          ))}
        </div>
        <Card className="p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <Input placeholder="Search by product or SKU..." className="w-full md:w-80" />
            <Select>
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
          <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Product</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">SKU</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Stock</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-text-secondary">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item, i) => {
                    const getStockStatus = (product: Product) => {
                      if (product.quantity === 0) return 'out of stock';
                      if (product.quantity <= product.min_quantity) return 'low stock';
                      return 'in stock';
                    };
                    
                    return (
                      <tr key={i} className="border-t border-border hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-text-primary">{item.name}</td>
                        <td className="px-4 py-2 text-text-primary">{item.sku}</td>
                        <td className="px-4 py-2 text-text-primary">{item.quantity}</td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {getStockStatus(item)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-text-secondary">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </td>
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
