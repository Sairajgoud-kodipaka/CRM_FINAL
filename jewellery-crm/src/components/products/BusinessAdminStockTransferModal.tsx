'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle, Search, X, Store, Globe, Download } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import type { ProductInventory } from '@/lib/api-service';

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

interface BusinessAdminStockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BusinessAdminStockTransferModal({ isOpen, onClose, onSuccess }: BusinessAdminStockTransferModalProps) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [createForm, setCreateForm] = useState({
    from_store: '',
    to_store: '',
    product: '',
    quantity: 0,
    reason: '',
    notes: '',
  });
  const [filterStore, setFilterStore] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all transfers across all stores (business admin can see everything)
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

      // Fetch all products from all stores
      const productsResponse = await apiService.getProducts({
        scope: 'all'
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

      // Fetch all stores
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
        setStores(storesData);
      }

      // Fetch inventory data for all stores
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
      const response = await apiService.createStockTransfer({
        from_store: parseInt(createForm.from_store),
        to_store: parseInt(createForm.to_store),
        product: parseInt(createForm.product),
        quantity: createForm.quantity,
        reason: createForm.reason,
        notes: createForm.notes,
        requested_by: user?.id || 0,
      });

      if (response.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          from_store: '',
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

  // Export all transfer data to CSV
  const exportTransfers = async () => {
    try {
      setExporting(true);
      
      // Convert transfers to CSV format
      const csvContent = convertTransfersToCSV(transfers);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-transfers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting transfers:', error);
      alert('Failed to export transfers');
    } finally {
      setExporting(false);
    }
  };

  // Convert transfers data to CSV format
  const convertTransfersToCSV = (transfers: StockTransfer[]) => {
    const headers = [
      'Transfer ID',
      'Product Name',
      'SKU',
      'From Store',
      'To Store',
      'Quantity',
      'Status',
      'Reason',
      'Requested By',
      'Approved By',
      'Created Date',
      'Transfer Date',
      'Notes'
    ];

    const csvRows = [headers.join(',')];

    transfers.forEach(transfer => {
      const row = [
        transfer.id,
        `"${transfer.product_name || ''}"`,
        transfer.product_sku || '',
        `"${transfer.from_store_name || ''}"`,
        `"${transfer.to_store_name || ''}"`,
        transfer.quantity,
        transfer.status,
        `"${transfer.reason || ''}"`,
        `"${transfer.requested_by_name || ''}"`,
        `"${transfer.approved_by_name || ''}"`,
        transfer.created_at,
        transfer.transfer_date || '',
        `"${transfer.notes || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  };

  // Filter products based on search
  const filterProducts = () => {
    if (!productSearch.trim()) {
      setFilteredProducts(products);
      return;
    }

    const searchLower = productSearch.toLowerCase();
    const filtered = products.filter(product => {
      return product.name.toLowerCase().includes(searchLower) || 
             product.sku.toLowerCase().includes(searchLower);
    });
    
    setFilteredProducts(filtered);
  };

  // Filter transfers based on store and status
  const getFilteredTransfers = () => {
    let filtered = transfers;
    
    if (filterStore !== 'all') {
      filtered = filtered.filter(transfer => 
        transfer.from_store_name === filterStore || transfer.to_store_name === filterStore
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(transfer => transfer.status === filterStatus);
    }
    
    return filtered;
  };

  // Update filtered products when search changes
  useEffect(() => {
    filterProducts();
  }, [productSearch, products]);

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

  const filteredTransfers = getFilteredTransfers();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              All Store Product Transfers
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Business Admin View - Monitor all stock transfers across all stores
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading transfers...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Transfer Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    Total transfers: {transfers.length} | Filtered: {filteredTransfers.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Package className="w-4 h-4 mr-2" />
                    Create Transfer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={exportTransfers}
                    disabled={exporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export All'}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Filter by Store</Label>
                  <Select value={filterStore} onValueChange={setFilterStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stores</SelectItem>
                      {Array.from(new Set(transfers.map(t => t.from_store_name).concat(transfers.map(t => t.to_store_name)))).filter(Boolean).map((storeName) => (
                        <SelectItem key={storeName} value={storeName}>
                          {storeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Filter by Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transfers List */}
              <div className="space-y-2">
                {filteredTransfers.map((transfer) => (
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

                {filteredTransfers.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <Package className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        {transfers.length === 0 ? 'No transfer requests found' : 'No transfers match your filters'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Transfer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stock Transfer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Business Admin - Create transfers between any stores
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="from_store">From Store</Label>
              <Select value={createForm.from_store} onValueChange={(value) => setCreateForm({ ...createForm, from_store: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source store" />
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
              <Label htmlFor="to_store">To Store</Label>
              <Select value={createForm.to_store} onValueChange={(value) => setCreateForm({ ...createForm, to_store: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination store" />
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
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted ${
                          createForm.product === product.id.toString() ? 'bg-primary/10 border-primary' : ''
                        }`}
                        onClick={() => setCreateForm({ ...createForm, product: product.id.toString() })}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.scope === 'global' ? 'Global Product' : 'Store Product'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
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
              <Input
                id="quantity"
                type="number"
                min="1"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 0 })}
              />
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
                  !createForm.from_store || 
                  !createForm.to_store || 
                  !createForm.product || 
                  createForm.quantity <= 0 || 
                  createForm.reason === '' ||
                  createForm.from_store === createForm.to_store
                }
              >
                Create Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
