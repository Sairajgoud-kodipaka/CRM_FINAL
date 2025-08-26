'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService, Product } from '@/lib/api-service';
import { Search, Filter, Eye, ShoppingCart, Upload, Download } from 'lucide-react';

export default function SalesProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term, category, and status
    let filtered = products || [];
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category?.toString() === categoryFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching products...');
      console.log('🔑 Auth token available:', 'checking...');
      
      const response = await apiService.getProducts();
      console.log('📦 Products API response:', response);
      console.log('📦 Response success:', response.success);
      console.log('📦 Response data type:', typeof response.data);
      console.log('📦 Response data:', response.data);
      
      // Handle paginated response
      let productsData: Product[] = [];
      if (Array.isArray(response.data)) {
        // Direct array response
        productsData = response.data;
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
        // Paginated response
        productsData = (response.data as any).results;
        console.log('📄 Paginated response - total count:', (response.data as any).count);
        console.log('📄 Paginated response - next page:', (response.data as any).next);
        console.log('📄 Paginated response - previous page:', (response.data as any).previous);
      } else if (response.data && typeof response.data === 'object') {
        // Check if it's a different structure
        console.log('📦 Response data structure:', Object.keys(response.data));
        if ('data' in response.data && Array.isArray((response.data as any).data)) {
          productsData = (response.data as any).data;
        }
      }
      
      console.log('✅ Processed products data:', productsData);
      console.log('📊 Products count:', productsData.length);
      
      if (productsData.length === 0) {
        console.log('⚠️ No products found - checking response structure:', response);
        console.log('⚠️ Response keys:', Object.keys(response));
        console.log('⚠️ Response data type:', typeof response.data);
        console.log('⚠️ Response data:', response.data);
      }
      
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      setProducts([]); // Set empty array on error
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
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'discontinued':
        return 'destructive';
      case 'out_of_stock':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleAddToCart = (product: Product) => {
    // This would integrate with a cart system
    console.log('Adding to cart:', product);
    // In a real implementation, this would add to a cart state or send to backend
  };

  const handleViewProduct = (product: Product) => {
    // This would navigate to product detail page
    console.log('Viewing product:', product);
    // In a real implementation, this would navigate to product detail
  };

  const handleImportProducts = () => {
    setShowImportModal(true);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        name: 'Gold Ring',
        sku: 'MJ01',
        category: 'Rings',
        selling_price: 25000,
        cost_price: 20000,
        quantity: 10,
        description: 'Beautiful gold ring'
      },
      {
        name: 'Silver Necklace',
        sku: 'MJ02',
        category: 'Necklaces',
        selling_price: 15000,
        cost_price: 12000,
        quantity: 5,
        description: 'Elegant silver necklace'
      },
      {
        name: 'Diamond Earrings',
        sku: 'MJ03',
        category: 'Earrings',
        selling_price: 30000,
        cost_price: 24000,
        quantity: '',
        description: 'Stunning diamond earrings (quantity optional)'
      }
    ];

    const csvContent = [
      'name,sku,category,selling_price,cost_price,quantity,description',
      '# Note: quantity is optional (defaults to 0 if not provided)',
      ...template.map(item => 
        `${item.name},${item.sku},${item.category},${item.selling_price},${item.cost_price},${item.quantity},"${item.description}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportLoading(true);
      console.log('📁 File selected:', file.name, file.size, file.type);
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📦 FormData created, entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await apiService.importProducts(formData);
      
      if (response.success) {
        alert('Products imported successfully!');
        setShowImportModal(false);
        fetchProducts(); // Refresh the product list
      } else {
        alert('Import failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Product Catalog</h1>
          <p className="text-text-secondary mt-1">Access the product catalog for recommendations</p>
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
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Product Catalog</h1>
        <p className="text-text-secondary mt-1">Access the product catalog for recommendations</p>
      </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search by product name, SKU, or description..." 
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          
          {/* Import/Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportProducts}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Updated</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-text-secondary truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-text-primary">
                      <div className="font-medium">{formatCurrency(product.selling_price)}</div>
                      {product.discount_price && (
                        <div className="text-xs text-green-600">
                          {formatCurrency(product.discount_price)} (Discounted)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      <div className="font-medium">{product.quantity}</div>
                      {product.is_low_stock && (
                        <div className="text-xs text-orange-600">Low Stock</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(product.status)} className="capitalize text-xs">
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {product.updated_at ? formatDate(product.updated_at) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.is_in_stock}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    {products.length === 0 ? 'No products found' : 'No products match your search criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length > 0 && (
          <div className="text-sm text-text-secondary text-center py-2">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </Card>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Import Products</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Upload a CSV file with the following columns:
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-4">
                  <li>• <strong>name</strong> - Product name</li>
                  <li>• <strong>sku</strong> - Your custom SKU (e.g., MJ01, MJ02)</li>
                  <li>• <strong>category</strong> - Product category</li>
                  <li>• <strong>selling_price</strong> - Selling price</li>
                  <li>• <strong>cost_price</strong> - Cost price</li>
                  <li>• <strong>quantity</strong> - Stock quantity</li>
                  <li>• <strong>description</strong> - Product description</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={importLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {importLoading ? 'Uploading...' : 'Click to upload CSV file'}
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  disabled={importLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  disabled={importLoading}
                >
                  Download Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}