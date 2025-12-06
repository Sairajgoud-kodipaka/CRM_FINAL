'use client';

import React, { useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { Upload, Download, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductData {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  cost_price: number;
  selling_price: number;
  discount_price?: number;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  weight?: number;
  material?: string;
  color?: string;
  size?: string;
  status?: string;
}

export default function ImportProductsModal({ isOpen, onClose, onSuccess }: ImportProductsModalProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [importData, setImportData] = useState<ProductData[]>([]);
  const [importStatus, setImportStatus] = useState<{index: number; status: 'pending' | 'creating' | 'success' | 'error'; message?: string}[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetImport = () => {
    setImportData([]);
    setImportStatus([]);
    setError(null);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  // Download CSV Template
  const downloadTemplate = () => {
    const headers = ['name', 'sku', 'category', 'cost_price', 'selling_price', 'quantity', 'description', 'weight', 'material', 'color', 'size', 'status'];
    const sampleData = [
      ['SET - LONG', 'SKU-001', '22ct Gold', '50000', '60000', '5', 'Beautiful long set', '25', 'Gold', 'Yellow', 'Standard', 'active'],
      ['SET - HALF', 'SKU-002', '22ct Gold', '35000', '42000', '8', 'Half set design', '18', 'Gold', 'Yellow', 'Medium', 'active'],
      ['BANGLES', 'SKU-003', '22ct Gold', '28000', '35000', '10', 'Traditional bangles', '15', 'Gold', 'Yellow', '2.4', 'active'],
      ['CHAIN', 'SKU-004', '22ct Gold', '15000', '18000', '12', 'Elegant chain', '8', 'Gold', 'Yellow', '18inch', 'active'],
      ['RING', 'SKU-005', '18ct Gold', '8000', '10000', '20', 'Modern ring', '3', 'Gold', 'Rose', '16', 'active'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      // Check for required columns - more flexible matching
      const hasName = headers.includes('name') || headers.includes('product_name');
      const hasSku = headers.includes('sku') || headers.includes('product_sku');
      
      if (!hasName) {
        setError('CSV must have a "name" column');
        return;
      }

      const parsedData: ProductData[] = [];
      const parseErrors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 2) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Skip empty rows
        const name = row.name || row.product_name || '';
        if (!name) continue;
        
        // Generate SKU if not provided
        const sku = row.sku || row.product_sku || `SKU-${Date.now()}-${i}`;
        
        // Parse prices - default to 0 if not provided (will be set later)
        const costPrice = parseFloat(row.cost_price) || 0;
        const sellingPrice = parseFloat(row.selling_price) || 0;
        
        parsedData.push({
          name: name,
          sku: sku,
          description: row.description || '',
          category: row.category || '',
          cost_price: costPrice,
          selling_price: sellingPrice,
          discount_price: row.discount_price ? parseFloat(row.discount_price) : undefined,
          quantity: parseInt(row.quantity) || 0,
          min_quantity: row.min_quantity ? parseInt(row.min_quantity) : 0,
          max_quantity: row.max_quantity ? parseInt(row.max_quantity) : 1000,
          weight: row.weight ? parseFloat(row.weight) : undefined,
          material: row.material || row.category || '',
          color: row.color || '',
          size: row.size || '',
          status: row.status || 'active',
        });
      }

      if (parsedData.length === 0) {
        setError('No valid product rows found. Make sure you have a "name" column.');
        return;
      }
      
      setImportData(parsedData);
      setImportStatus(parsedData.map((_, index) => ({ index, status: 'pending' })));
      setError(null);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Helper function to parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Bulk import products one by one with status tracking
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    
    for (let i = 0; i < importData.length; i++) {
      setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'creating' } : s));
      
      try {
        const productData = {
          ...importData[i],
          scope: 'store' as const,
        };
        
        const response = await apiService.createProduct(productData);
        
        if (response.success) {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'success' } : s));
        } else {
          // Extract meaningful error message - handle both string and object errors
          let errorMsg = 'Failed';
          if (typeof response.message === 'string') {
            errorMsg = response.message;
          } else if (response.message && typeof response.message === 'object') {
            // Handle validation errors object
            errorMsg = Object.entries(response.message)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join('; ');
          }
          // Simplify common errors
          if (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('sku')) {
            errorMsg = 'SKU exists';
          }
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: errorMsg } : s));
        }
      } catch (err: any) {
        let errorMsg = 'Error';
        if (typeof err.message === 'string') {
          errorMsg = err.message;
        } else if (err.message && typeof err.message === 'object') {
          errorMsg = JSON.stringify(err.message);
        }
        setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: errorMsg } : s));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    setIsImporting(false);
    onSuccess();
  };

  const successCount = importStatus.filter(s => s.status === 'success').length;
  const errorCount = importStatus.filter(s => s.status === 'error').length;
  const isComplete = importStatus.length > 0 && importStatus.every(s => s.status === 'success' || s.status === 'error');

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={handleClose}
      title="Import Products"
      description="Upload a CSV file to import products"
      size={isMobile ? "full" : isTablet ? "lg" : "xl"}
      showCloseButton={true}
      actions={
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          {importData.length > 0 && !isComplete ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={isImporting || importData.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating... ({successCount}/{importData.length})
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Create {importData.length} Products
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              {isComplete ? 'Done' : 'Cancel'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
          <p className="text-sm text-blue-800 mb-2">
            Upload a CSV with these columns:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="outline" className="bg-white text-xs">name *</Badge>
            <Badge variant="outline" className="bg-white text-xs">sku</Badge>
            <Badge variant="outline" className="bg-white text-xs">category</Badge>
            <Badge variant="outline" className="bg-white text-xs">cost_price</Badge>
            <Badge variant="outline" className="bg-white text-xs">selling_price</Badge>
            <Badge variant="outline" className="bg-white text-xs">quantity</Badge>
            <Badge variant="outline" className="bg-white text-xs opacity-60">weight</Badge>
            <Badge variant="outline" className="bg-white text-xs opacity-60">material</Badge>
            <Badge variant="outline" className="bg-white text-xs opacity-60">color</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" /> Download Template
          </Button>
        </div>
        
        {/* File Upload or Preview */}
        {importData.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mb-3">CSV files only</p>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                Select CSV File
              </label>
            </Button>
          </div>
        ) : (
          <>
            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium">{importData.length} products to import</span>
                <Button variant="ghost" size="sm" onClick={resetImport} disabled={isImporting}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importData.map((product, index) => {
                      const status = importStatus[index];
                      return (
                        <tr 
                          key={index} 
                          className={
                            status?.status === 'error' ? 'bg-red-50' : 
                            status?.status === 'success' ? 'bg-green-50' : 
                            status?.status === 'creating' ? 'bg-blue-50' : ''
                          }
                        >
                          <td className="px-3 py-2">
                            {status?.status === 'pending' && <span className="text-gray-400 text-lg">●</span>}
                            {status?.status === 'creating' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                            {status?.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {status?.status === 'error' && (
                              <span title={status.message} className="cursor-help">
                                <XCircle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 truncate max-w-[120px]" title={product.name}>
                            {product.name}
                            {status?.status === 'error' && (
                              <span className="text-xs text-red-500 block">{status.message}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs">{product.sku}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{product.category || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            {product.selling_price > 0 ? `₹${product.selling_price.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Progress */}
            {isImporting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <p className="text-sm text-blue-800">
                    Creating products... {successCount} of {importData.length} completed
                  </p>
                </div>
              </div>
            )}
            
            {/* Results Summary */}
            {isComplete && (
              <div className="flex gap-4 text-sm p-3 bg-gray-50 rounded-lg">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {successCount} created successfully
                </span>
                {errorCount > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errorCount} failed (hover to see why)
                  </span>
                )}
              </div>
            )}
          </>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
