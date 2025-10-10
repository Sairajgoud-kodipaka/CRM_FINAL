'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { Package, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle, Search, X } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import type { ProductInventory } from '@/lib/api-service';
import { Skeleton } from '@/components/ui/skeleton';

interface StockTransfer {
  id: number;
  from_store: number;
  from_store_name?: string;
  to_store: number;
  to_store_name?: string;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  reason: string;
  requested_by: number;
  requested_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  transfer_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
  quantity?: number;
  min_quantity?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
}

interface Store {
  id: number;
  name: string;
}

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockTransferModal({ isOpen, onClose, onSuccess }: StockTransferModalProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [createForm, setCreateForm] = useState<{
    to_store: string;
    product: string;
    quantity: number;
    reason: string;
    notes: string;
  }>({
    to_store: '',
    product: '',
    quantity: 0,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transfers
      const transfersResponse = await apiService.getStockTransfers();
      if (transfersResponse.success && transfersResponse.data) {
        let transfersData: StockTransfer[] = [];
        if (Array.isArray(transfersResponse.data)) {
          transfersData = transfersResponse.data;
        } else if (typeof transfersResponse.data === 'object' && transfersResponse.data !== null) {
          const data = transfersResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            transfersData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            transfersData = data.data;
          }
        }
        setTransfers(transfersData);
      }

      // Fetch products - Get global catalogue for transfer requests
      const productsResponse = await apiService.getProducts({
        scope: 'all' // Get all products (global + store) for transfer requests
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
      }

      // Fetch inventory data for current store
      if (user?.store) {
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
      }

      // Fetch stores
      const storesResponse = await apiService.getStores();
      if (storesResponse.success && storesResponse.data) {
        let storesData: Store[] = [];
        if (Array.isArray(storesResponse.data)) {
          storesData = storesResponse.data;
        } else if (typeof storesResponse.data === 'object' && storesResponse.data !== null) {
          const data = storesResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            storesData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            storesData = data.data;
          }
        }
        // Filter out the current user's store from the destination options
        storesData = storesData.filter(store => store.id !== user?.store);
        setStores(storesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTransfers([]);
      setProducts([]);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    try {
      if (!user?.store) {
        console.error('User store not found');
        return;
      }

      // Validate stock availability
      const stockInfo = canTransferProduct(parseInt(createForm.product));
      if (!stockInfo.canTransfer) {
        alert(`Cannot request transfer: ${stockInfo.reason}`);
        return;
      }

      // Check if requested quantity is available
      const productInventory = inventory.find(inv => inv.product === parseInt(createForm.product));
      if (productInventory && createForm.quantity > productInventory.quantity) {
        alert(`Cannot request ${createForm.quantity} units. Only ${productInventory.quantity} units available in stock.`);
        return;
      }

      const response = await apiService.createStockTransfer({
        from_store: user.store,
        to_store: parseInt(createForm.to_store),
        product: parseInt(createForm.product),
        quantity: createForm.quantity,
        reason: createForm.reason,
        notes: createForm.notes,
        requested_by: user.id,
      });

      if (response.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          to_store: '',
          product: '',
          quantity: 0,
          reason: '',
          notes: '',
        });
        setProductSearch('');
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
    }
  };

  const handleApproveTransfer = async (transferId: number) => {
    try {
      const response = await apiService.approveStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
    }
  };

  const handleCompleteTransfer = async (transferId: number) => {
    try {
      const response = await apiService.completeStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error completing transfer:', error);
    }
  };

  const handleCancelTransfer = async (transferId: number) => {
    try {
      const response = await apiService.cancelStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error);
    }
  };

  // Filter products based on search and stock availability
  const filterProducts = () => {
    if (!productSearch.trim()) {
      setFilteredProducts(products);
      return;
    }

    const searchLower = productSearch.toLowerCase();
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                           product.sku.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
      
      // Check if product has sufficient stock in current store
      const productInventory = inventory.find(inv => inv.product === product.id);
      if (productInventory) {
        return productInventory.quantity > 0 && !productInventory.is_out_of_stock;
      }
      
      return true; // Include products without inventory data
    });
    
    setFilteredProducts(filtered);
  };

  // Check if a product can be transferred (has sufficient stock)
  const canTransferProduct = (productId: number): { canTransfer: boolean; reason?: string; stockLevel: string } => {
    const productInventory = inventory.find(inv => inv.product === productId);
    
    if (!productInventory) {
      return { canTransfer: false, reason: 'No inventory data available', stockLevel: 'Unknown' };
    }
    
    if (productInventory.is_out_of_stock || productInventory.quantity === 0) {
      return { canTransfer: false, reason: 'Product is out of stock', stockLevel: 'Out of Stock' };
    }
    
    if (productInventory.is_low_stock) {
      return { canTransfer: false, reason: 'Product has low stock', stockLevel: 'Low Stock' };
    }
    
    return { canTransfer: true, stockLevel: 'In Stock' };
  };

  // Get stock status badge for a product
  const getStockStatusBadge = (productId: number) => {
    const productInventory = inventory.find(inv => inv.product === productId);
    
    if (!productInventory) {
      return <Badge variant="outline">No Data</Badge>;
    }
    
    if (productInventory.is_out_of_stock || productInventory.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    
    if (productInventory.is_low_stock) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    
    return <Badge variant="default">In Stock ({productInventory.quantity})</Badge>;
  };

  // Update filtered products when search changes
  useEffect(() => {
    filterProducts();
  }, [productSearch, products, inventory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={onClose}
        title="Stock Transfers"
        description="Manage inventory transfers between stores"
        size={isMobile ? "full" : isTablet ? "lg" : "xl"}
        showCloseButton={true}
        actions={
          <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          </div>
        }
      >

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                <p className="text-muted-foreground">Loading transfers...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Transfer Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage inter-store stock transfers
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available products: {products.length} | Transferable: {filteredProducts.filter(p => canTransferProduct(p.id).canTransfer).length}
                  </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Package className="w-4 h-4 mr-2" />
                  Request Transfer
                </Button>
              </div>

              {/* Transfers List */}
              <div className="space-y-2">
                {transfers.map((transfer) => (
                  <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{transfer.product_name}</h4>
                            {getStatusBadge(transfer.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">SKU: {transfer.product_sku}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-medium">{transfer.from_store_name}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{transfer.to_store_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Quantity: {transfer.quantity} | Requested by: {transfer.requested_by_name}
                          </p>
                          {transfer.reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {transfer.reason}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transfer.created_at)}
                            </p>
                            {transfer.approved_by_name && (
                              <p className="text-xs text-muted-foreground">
                                Approved by: {transfer.approved_by_name}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            {transfer.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveTransfer(transfer.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {transfer.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCompleteTransfer(transfer.id)}
                              >
                                <Package className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {transfers.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <Package className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No transfer requests found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
      </ResponsiveDialog>

      {/* Create Transfer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Stock Transfer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Total products available: {products.length} | 
              Transferable: {products.filter(p => canTransferProduct(p.id).canTransfer).length}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="to_store">To Store</Label>
              <Select value={createForm.to_store} onValueChange={(value) => setCreateForm({ ...createForm, to_store: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="product">Product</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Search products by name or SKU</span>
                  <span className="font-medium">
                    {filteredProducts.length} of {products.length} products
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                  {productSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setProductSearch('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const stockInfo = canTransferProduct(product.id);
                      const isDisabled = !stockInfo.canTransfer;
                      
                      return (
                        <div
                          key={product.id}
                          className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted ${
                            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                          } ${createForm.product === product.id.toString() ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => {
                            if (!isDisabled) {
                              setCreateForm({ ...createForm, product: product.id.toString() });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                              <div className="text-xs text-muted-foreground">
                                {product.scope === 'global' ? 'Global Product' : 'Store Product'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStockStatusBadge(product.id)}
                              {isDisabled && (
                                <div className="text-xs text-red-600 max-w-32 text-right">
                                  {stockInfo.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      {productSearch ? 'No products found matching your search' : 'No products available'}
                    </div>
                  )}
                </div>
                
                {createForm.product && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {products.find(p => p.id.toString() === createForm.product)?.name}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="space-y-2">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 0 })}
                />
                {createForm.product && (
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const productInventory = inventory.find(inv => inv.product === parseInt(createForm.product));
                      if (productInventory) {
                        return `Available stock: ${productInventory.quantity} units`;
                      }
                      return 'Stock information not available';
                    })()}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                placeholder="Why do you need this transfer?"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTransfer}
                disabled={
                  Boolean(createForm.to_store === '') || 
                  Boolean(createForm.product === '') || 
                  Boolean(createForm.quantity <= 0) || 
                  Boolean(createForm.reason === '') ||
                  Boolean(createForm.product && !canTransferProduct(parseInt(createForm.product)).canTransfer)
                }
              >
                Request Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 
