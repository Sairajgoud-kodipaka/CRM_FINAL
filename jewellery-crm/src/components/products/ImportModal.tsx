'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api-service';
import { X, Download, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ImportModalProps {
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

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
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
    const headers = ['name', 'sku', 'description', 'category', 'cost_price', 'selling_price', 'discount_price', 'quantity', 'min_quantity', 'max_quantity', 'weight', 'material', 'color', 'size', 'status'];
    const sampleData = [
      ['Gold Ring 22K', 'GR-22K-001', 'Beautiful 22K gold ring', 'Rings', '45000', '55000', '52000', '10', '2', '50', '5.2', 'Gold', 'Yellow', '18', 'active'],
      ['Silver Necklace', 'SN-925-001', 'Elegant 925 silver necklace', 'Necklaces', '8000', '12000', '11000', '15', '3', '100', '25', 'Silver', 'Silver', 'Standard', 'active'],
      ['Diamond Earrings', 'DE-18K-001', 'Diamond studded earrings', 'Earrings', '85000', '120000', '', '5', '1', '20', '3.5', 'Gold+Diamond', 'White', 'Small', 'active'],
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
      const requiredHeaders = ['name', 'sku', 'cost_price', 'selling_price', 'quantity'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setError(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const parsedData: ProductData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        // Handle CSV with quoted values
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Skip empty rows
        if (!row.name || !row.sku) continue;
        
        parsedData.push({
          name: row.name,
          sku: row.sku,
          description: row.description || '',
          category: row.category || '',
          cost_price: parseFloat(row.cost_price) || 0,
          selling_price: parseFloat(row.selling_price) || 0,
          discount_price: row.discount_price ? parseFloat(row.discount_price) : undefined,
          quantity: parseInt(row.quantity) || 0,
          min_quantity: row.min_quantity ? parseInt(row.min_quantity) : 1,
          max_quantity: row.max_quantity ? parseInt(row.max_quantity) : 100,
          weight: row.weight ? parseFloat(row.weight) : undefined,
          material: row.material || '',
          color: row.color || '',
          size: row.size || '',
          status: row.status || 'active',
        });
      }

      if (parsedData.length === 0) {
        setError('No valid product rows found in the file');
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

  // Bulk import products
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    
    for (let i = 0; i < importData.length; i++) {
      setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'creating' } : s));
      
      try {
        const productData = {
          ...importData[i],
          scope: 'global' as const,
        };
        
        const response = await apiService.createProduct(productData);
        
        if (response.success) {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'success' } : s));
        } else {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: response.message || 'Failed' } : s));
        }
      } catch (err: any) {
        setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: err.message || 'Error' } : s));
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsImporting(false);
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-[650px] mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Import Products</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
            <p className="text-sm text-blue-800 mb-2">
              Upload a CSV file with the following columns:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="bg-white text-xs">name *</Badge>
              <Badge variant="outline" className="bg-white text-xs">sku *</Badge>
              <Badge variant="outline" className="bg-white text-xs">cost_price *</Badge>
              <Badge variant="outline" className="bg-white text-xs">selling_price *</Badge>
              <Badge variant="outline" className="bg-white text-xs">quantity *</Badge>
              <Badge variant="outline" className="bg-white text-xs opacity-60">description</Badge>
              <Badge variant="outline" className="bg-white text-xs opacity-60">category</Badge>
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
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importData.map((product, index) => {
                        const status = importStatus[index];
                        return (
                          <tr key={index} className={status?.status === 'error' ? 'bg-red-50' : status?.status === 'success' ? 'bg-green-50' : ''}>
                            <td className="px-3 py-2">
                              {status?.status === 'pending' && <span className="text-gray-400 text-lg">●</span>}
                              {status?.status === 'creating' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                              {status?.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              {status?.status === 'error' && (
                                <span title={status.message}>
                                  <XCircle className="w-4 h-4 text-red-500" />
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 truncate max-w-[150px]" title={product.name}>{product.name}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono text-xs">{product.sku}</td>
                            <td className="px-3 py-2 text-right">₹{product.selling_price.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right">{product.quantity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Import Progress */}
              {isImporting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <p className="text-sm text-blue-800">
                      Creating products... {importStatus.filter(s => s.status === 'success').length} of {importData.length} completed
                    </p>
                  </div>
                </div>
              )}
              
              {/* Results Summary */}
              {!isImporting && importStatus.some(s => s.status === 'success' || s.status === 'error') && (
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {importStatus.filter(s => s.status === 'success').length} created
                  </span>
                  {importStatus.filter(s => s.status === 'error').length > 0 && (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {importStatus.filter(s => s.status === 'error').length} failed
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
          
          <div className="flex gap-3 pt-2">
            {importData.length > 0 && !importStatus.some(s => s.status === 'success') && (
              <Button
                onClick={handleBulkImport}
                disabled={isImporting || importData.length === 0}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Products...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Create {importData.length} Products
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
              className={importData.length === 0 || importStatus.some(s => s.status === 'success') ? 'flex-1' : ''}
            >
              {importStatus.some(s => s.status === 'success') ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
