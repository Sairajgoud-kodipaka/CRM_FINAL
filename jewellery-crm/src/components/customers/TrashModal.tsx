"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiService, Client } from "@/lib/api-service";
import { Trash2, RotateCcw, Eye, Calendar } from "lucide-react";

interface TrashModalProps {
  open: boolean;
  onClose: () => void;
  onCustomerRestored: () => void;
}

export function TrashModal({ open, onClose, onCustomerRestored }: TrashModalProps) {
  const [trashedCustomers, setTrashedCustomers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTrashedCustomers();
    }
  }, [open]);

  const fetchTrashedCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTrashedClients();
      
      if (response.success && response.data) {
        const customersData = Array.isArray(response.data) 
          ? response.data 
          : response.data.results || response.data.data || [];
        setTrashedCustomers(customersData);
      }
    } catch (error) {
      console.error('Error fetching trashed customers:', error);
      setTrashedCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (customerId: string) => {
    try {
      setRestoring(customerId);
      const response = await apiService.restoreClient(customerId);
      
      if (response.success) {
        console.log('Customer restored successfully');
        onCustomerRestored();
        fetchTrashedCustomers(); // Refresh the list
      } else {
        console.error('Failed to restore customer:', response);
        alert('Failed to restore customer. Please try again.');
      }
    } catch (error) {
      console.error('Error restoring customer:', error);
      alert('Error restoring customer. Please check the console for details.');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (!status) return 'outline';
    
    switch (status.toLowerCase()) {
      case 'customer':
        return 'default';
      case 'prospect':
        return 'secondary';
      case 'lead':
        return 'outline';
      case 'inactive':
        return 'destructive';
      case 'exhibition':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trash</DialogTitle>
            <DialogDescription>Loading trashed customers...</DialogDescription>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Trash</DialogTitle>
              <DialogDescription>
                View and restore deleted customers
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-500">
                {trashedCustomers.length} customer(s) in trash
              </span>
            </div>
          </div>
        </DialogHeader>

        {trashedCustomers.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers in trash</h3>
              <p className="text-gray-500">
                Deleted customers will appear here. You can restore them or they will be permanently deleted after 30 days.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Deleted</th>
                    <th className="px-4 py-3 text-left font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-t border-border hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td className="px-4 py-3 text-text-primary">{customer.email}</td>
                      <td className="px-4 py-3 text-text-primary">{customer.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(customer.status || '')} className="capitalize text-xs">
                          {customer.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {customer.deleted_at ? formatDate(customer.deleted_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-800"
                            onClick={() => handleRestore(customer.id.toString())}
                            disabled={restoring === customer.id.toString()}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            {restoring === customer.id.toString() ? 'Restoring...' : 'Restore'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="text-sm text-gray-500 text-center py-4">
              <p>💡 Tip: Customers in trash will be automatically permanently deleted after 30 days.</p>
              <p>You can restore them anytime before then.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 