'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api-service';
import { Loader2, X, Download, Upload, FileText } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.importProducts(formData);
      if (response.success) {
        setSuccess('Products imported successfully!');
        onSuccess();
        setTimeout(() => {
          onClose();
          setFile(null);
          setSuccess(null);
        }, 2000);
      } else {
        setError(response.message || 'Failed to import products');
      }
    } catch (error) {
      console.error('Failed to import products:', error);
      setError('Failed to import products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,sku,description,category,brand,cost_price,selling_price,discount_price,quantity,min_quantity,max_quantity,weight,dimensions,material,color,size,status,is_featured,is_bestseller
Gold Ring,GOLD001,Beautiful gold ring,Rings,GoldBrand,5000,8000,7500,10,2,50,5.2,10x5x2 cm,Gold,Yellow,18K,active,true,false
Silver Necklace,SILVER001,Elegant silver necklace,Necklaces,SilverBrand,3000,5000,4500,15,3,100,8.5,15x8x1 cm,Silver,White,925,active,false,true`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Import Products</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded">
              {success}
            </div>
          )}

          {/* Template Download */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-2">Download Template</h3>
            <p className="text-sm text-blue-700 mb-3">
              Download the CSV template to see the required format for importing products.
            </p>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select CSV File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Only CSV files are supported
                  </p>
                </label>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{file.name}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!file || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Products'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <h4 className="font-semibold">Instructions:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Download the template to see the required format</li>
              <li>Fill in your product data following the template structure</li>
              <li>Save the file as CSV format</li>
              <li>Upload the file to import your products</li>
              <li>Required fields: name, sku, cost_price, selling_price, quantity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 