'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Eye, Edit, Trash2, IndianRupee, AlertTriangle, Store, Tag, TrendingUp, Upload, Download } from 'lucide-react';
import { apiService, Product } from '@/lib/api-service';
import AuthGuard from '@/components/auth/AuthGuard';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InventoryModal from '@/components/products/InventoryModal';
import StockTransferModal from '@/components/products/StockTransferModal';
import AddProductModal from '@/components/products/AddProductModal';
import CategoriesModal from '@/components/products/CategoriesModal';
import ProductActionsModal from '@/components/products/ProductActionsModal';
import ImportProductsModal from '@/components/products/ImportProductsModal';

interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
}

interface ProductInventory {
  id: number;
  product: number;
  product_name?: string;
  product_sku?: string;
  store: number;
  store_name?: string;
  quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  max_stock: number;
  location?: string;
  last_updated: string;
  available_quantity?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
}

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'store'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAction, setSelectedAction] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchTerm, categoryFilter, statusFilter, scopeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products with scope filter
      const productsResponse = await apiService.getProducts({
        search: searchTerm || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
      });
      
      if (productsResponse.success && productsResponse.data) {
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

      // Fetch categories
      const categoriesResponse = await apiService.getCategories({
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
      });
      
      if (categoriesResponse.success && categoriesResponse.data) {
        let categoriesData: Category[] = [];
        if (Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        } else if (typeof categoriesResponse.data === 'object' && categoriesResponse.data !== null) {
          const data = categoriesResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            categoriesData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            categoriesData = data.data;
          }
        }
        setCategories(categoriesData);
      }

      // Fetch inventory
      const inventoryResponse = await apiService.getInventory();
      if (inventoryResponse.success && inventoryResponse.data) {
        let inventoryData: ProductInventory[] = [];
        if (Array.isArray(inventoryResponse.data)) {
          inventoryData = inventoryResponse.data;
        } else if (typeof inventoryResponse.data === 'object' && inventoryResponse.data !== null) {
          const data = inventoryResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            inventoryData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            inventoryData = data.data;
          }
        }
        setInventory(inventoryData);
      }

      // Fetch stats
      const statsResponse = await apiService.getProductStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCategories([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category?.toString() === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesScope = scopeFilter === 'all' || product.scope === scopeFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesScope;
  }) : [];

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'out of stock', variant: 'destructive' as const };
    if (product.quantity <= product.min_quantity) return { status: 'low stock', variant: 'secondary' as const };
    return { status: 'in stock', variant: 'default' as const };
  };

  const getStockIcon = (product: Product) => {
    if (product.quantity === 0) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (product.quantity <= product.min_quantity) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Package className="w-4 h-4 text-green-500" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScopeIcon = (scope: string) => {
    return scope === 'global' ? <TrendingUp className="w-4 h-4" /> : <Store className="w-4 h-4" />;
  };

  const getScopeLabel = (scope: string) => {
    return scope === 'global' ? 'Global' : 'Store';
  };

  const getScopeBadgeVariant = (scope: string) => {
    return scope === 'global' ? 'default' : 'secondary';
  };

  // Export stock transfer data
  const exportStockTransfers = async () => {
    try {
      setExporting(true);
      console.log('Starting export of stock transfers...');
      
      // First, test if the backend is accessible
      try {
        const testResponse = await fetch('http://localhost:8000/api/products/transfers/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Test response status:', testResponse.status);
        
        if (!testResponse.ok) {
          throw new Error(`Backend responded with status: ${testResponse.status}`);
        }
      } catch (testError) {
        console.error('Backend connection test failed:', testError);
        alert('Cannot connect to backend server. Please ensure the Django backend is running on port 8000.');
        return;
      }
      
      // Use the existing API service to fetch stock transfer data
      const response = await apiService.getStockTransfers();
      console.log('Export response:', response);
      
      if (response.success && response.data) {
        let transfers: any[] = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          transfers = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const data = response.data as any;
          if (data.results && Array.isArray(data.results)) {
            transfers = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            transfers = data.data;
          }
        }
        
        console.log('Number of transfers found:', transfers.length);
        
        if (transfers.length === 0) {
          alert('No stock transfers found to export.');
          return;
        }
        
        // Convert to CSV format
        const csvContent = convertTransfersToCSV(transfers);
        console.log('CSV content length:', csvContent.length);
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log('Blob created:', blob.size, 'bytes');
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stock_transfers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        console.log('Downloading file...');
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Export completed successfully');
      } else {
        console.error('Failed to fetch transfers:', response);
        alert('Failed to fetch transfer data. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error exporting stock transfers:', error);
      alert('Error exporting transfers. Please check the console for details.');
    } finally {
      setExporting(false);
    }
  };

  const convertTransfersToCSV = (transfers: any[]) => {
    if (transfers.length === 0) return 'No transfers found';
    
    const headers = [
      'ID',
      'From Store',
      'To Store', 
      'Product Name',
      'Product SKU',
      'Quantity',
      'Reason',
      'Requested By',
      'Approved By',
      'Status',
      'Transfer Date',
      'Notes',
      'Created At',
      'Updated At'
    ];
    
    const csvRows = [headers.join(',')];
    
    transfers.forEach(transfer => {
      const row = [
        transfer.id,
        transfer.from_store_name || transfer.from_store,
        transfer.to_store_name || transfer.to_store,
        transfer.product_name || transfer.product,
        transfer.product_sku || '',
        transfer.quantity,
        `"${transfer.reason.replace(/"/g, '""')}"`,
        transfer.requested_by_name || transfer.requested_by,
        transfer.approved_by_name || transfer.approved_by || '',
        transfer.status,
        transfer.transfer_date || '',
        `"${(transfer.notes || '').replace(/"/g, '""')}"`,
        transfer.created_at,
        transfer.updated_at
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const handleProductAction = (product: Product, action: 'view' | 'edit' | 'delete') => {
    setSelectedProduct(product);
    setSelectedAction(action);
    setIsActionsModalOpen(true);
  };

  const handleActionsModalClose = () => {
    setIsActionsModalOpen(false);
    setSelectedProduct(null);
    setSelectedAction(null);
  };

  const statsCards = [
    { 
      label: 'Total Products', 
      value: stats.total_products || 0,
      sub: 'All products in inventory',
      icon: Package
    },
    { 
      label: 'Low Stock', 
      value: stats.low_stock || 0,
      sub: 'Products below minimum',
      icon: AlertTriangle
    },
    { 
      label: 'Categories', 
      value: categories.length,
      sub: 'Product categories',
      icon: Tag
    },
    { 
      label: 'Total Value', 
      value: formatCurrency(stats.total_value || 0),
      sub: 'Inventory value',
      icon: IndianRupee
    },
  ];

  return (
    <AuthGuard requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Store Products</h1>
            <p className="text-muted-foreground">
              Manage your store's product catalog and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCategoriesModalOpen(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Categories
            </Button>
            <Button variant="outline" onClick={() => setIsInventoryModalOpen(true)}>
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </Button>
            <Button variant="outline" onClick={() => setIsStockTransferModalOpen(true)}>
              <Package className="w-4 h-4 mr-2" />
              Transfers
            </Button>
            <Button 
              variant="outline" 
              onClick={exportStockTransfers}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Transfers'}
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scopeFilter} onValueChange={(value: 'all' | 'global' | 'store') => setScopeFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="store">Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                  {product.main_image_url ? (
                    <img
                      src={product.main_image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Scope Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant={getScopeBadgeVariant(product.scope)} className="text-xs">
                      {getScopeIcon(product.scope)}
                      <span className="ml-1">{getScopeLabel(product.scope)}</span>
                    </Badge>
                  </div>

                  {/* Stock Status */}
                  <div className="absolute top-2 right-2">
                    <Badge variant={getStockStatus(product).variant}>
                      {getStockIcon(product)}
                      <span className="ml-1">{getStockStatus(product).status}</span>
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg truncate" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    
                    {product.category_name && (
                      <p className="text-sm text-muted-foreground">
                        Category: {product.category_name}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold">
                          {formatCurrency(product.current_price || product.selling_price)}
                        </p>
                        {product.discount_price && product.discount_price !== product.selling_price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.selling_price)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Stock: {product.quantity}
                        </p>
                        {product.is_low_stock && (
                          <p className="text-xs text-yellow-600">Low Stock</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-1">
                        {product.is_featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                        {product.is_bestseller && (
                          <Badge variant="secondary" className="text-xs">Best Seller</Badge>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Package className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleProductAction(product, 'view')}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleProductAction(product, 'edit')}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleProductAction(product, 'delete')}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || scopeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchData();
          }}
        />
        <CategoriesModal
          isOpen={isCategoriesModalOpen}
          onClose={() => setIsCategoriesModalOpen(false)}
          onSuccess={() => {
            setIsCategoriesModalOpen(false);
            fetchData();
          }}
        />
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          onSuccess={() => {
            setIsInventoryModalOpen(false);
            fetchData();
          }}
        />
        <StockTransferModal
          isOpen={isStockTransferModalOpen}
          onClose={() => setIsStockTransferModalOpen(false)}
          onSuccess={() => {
            setIsStockTransferModalOpen(false);
            fetchData();
          }}
        />

        {selectedProduct && (
          <ProductActionsModal
            isOpen={isActionsModalOpen}
            onClose={handleActionsModalClose}
            product={selectedProduct}
            action={selectedAction!}
            onSuccess={() => {
              handleActionsModalClose();
              fetchData();
            }}
          />
        )}

        <ImportProductsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchData();
          }}
        />
      </div>
    </AuthGuard>
  );
} 