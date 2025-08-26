'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { apiService } from '@/lib/api-service';

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

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryModal({ isOpen, onClose, onSuccess }: InventoryModalProps) {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProductInventory | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    quantity: 0,
    reorder_point: 0,
    max_stock: 0,
    location: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInventory();
      
      if (response.success && response.data) {
        let inventoryData: ProductInventory[] = [];
        if (Array.isArray(response.data)) {
          inventoryData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const data = response.data as any;
          if (data.results && Array.isArray(data.results)) {
            inventoryData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            inventoryData = data.data;
          }
        }
        setInventory(inventoryData);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedItem) return;

    try {
      const response = await apiService.updateInventory(selectedItem.id.toString(), {
        product: selectedItem.product,
        store: selectedItem.store,
        quantity: updateForm.quantity,
        reorder_point: updateForm.reorder_point,
        max_stock: updateForm.max_stock,
        location: updateForm.location,
      });

      if (response.success) {
        setIsUpdateModalOpen(false);
        setSelectedItem(null);
        fetchInventory();
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const openUpdateModal = (item: ProductInventory) => {
    setSelectedItem(item);
    setUpdateForm({
      quantity: item.quantity,
      reorder_point: item.reorder_point,
      max_stock: item.max_stock,
      location: item.location || '',
    });
    setIsUpdateModalOpen(true);
  };

  const getStockStatus = (item: ProductInventory) => {
    if (item.is_out_of_stock) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (item.is_low_stock) return { status: 'Low Stock', variant: 'secondary' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  const getStockIcon = (item: ProductInventory) => {
    if (item.is_out_of_stock) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (item.is_low_stock) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Package className="w-4 h-4 text-green-500" />;
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Store Inventory Management
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading inventory...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Inventory Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <p className="text-2xl font-bold">{inventory.length}</p>
                      </div>
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {inventory.filter(item => item.is_low_stock).length}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                          {inventory.filter(item => item.is_out_of_stock).length}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                        <p className="text-2xl font-bold">
                          {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inventory List */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Inventory Items</h3>
                <div className="grid gap-4">
                  {inventory.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.product_name}</h4>
                              <Badge variant={getStockStatus(item).variant}>
                                {getStockIcon(item)}
                                <span className="ml-1">{getStockStatus(item).status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                            {item.location && (
                              <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{item.quantity}</span>
                                <span className="text-sm text-muted-foreground">in stock</span>
                              </div>
                              {item.reserved_quantity > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.reserved_quantity} reserved
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Min: {item.reorder_point} | Max: {item.max_stock}
                              </p>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUpdateModal(item)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last updated: {formatDate(item.last_updated)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {inventory.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <Package className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No inventory items found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Inventory Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label>Product</Label>
                <p className="text-sm font-medium">{selectedItem.product_name}</p>
                <p className="text-xs text-muted-foreground">SKU: {selectedItem.product_sku}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Current Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={updateForm.quantity}
                    onChange={(e) => setUpdateForm({ ...updateForm, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={updateForm.location}
                    onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                    placeholder="e.g., Shelf A1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    value={updateForm.reorder_point}
                    onChange={(e) => setUpdateForm({ ...updateForm, reorder_point: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_stock">Max Stock</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    value={updateForm.max_stock}
                    onChange={(e) => setUpdateForm({ ...updateForm, max_stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateInventory}>
                  Update Inventory
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 