'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api-service';
import { X, Download, Upload, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [isDragOver, setIsDragOver] = useState(false);

  const resetFileInput = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const validateAndSetFile = (selectedFile: File) => {
    console.log('Processing file:', selectedFile.name, selectedFile.type);
    // More comprehensive CSV file validation
    const isValidCSV = selectedFile.type === 'text/csv' || 
                      selectedFile.name.toLowerCase().endsWith('.csv') ||
                      selectedFile.type === 'application/csv' ||
                      selectedFile.type === 'text/plain';
    
    if (isValidCSV) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      console.log('File accepted:', selectedFile.name);
    } else {
      setError('Please select a valid CSV file. Only .csv files are supported.');
      setFile(null);
      console.log('File rejected - invalid type:', selectedFile.type);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change event triggered:', e.target.files);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    } else {
      setFile(null);
      setError(null);
      console.log('No file selected');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const selectedFile = droppedFiles[0];
      validateAndSetFile(selectedFile);
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
          resetFileInput();
          onClose();
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
        const csvContent = `name,sku,description,category,cost_price,selling_price,discount_price,quantity,min_quantity,max_quantity,weight,dimensions,material,color,size,status,is_featured,is_bestseller
Gold Ring,GOLD001,Beautiful gold ring,Rings,5000,8000,7500,10,2,50,5.2,10 x 5 x 2 cm,Gold,Yellow,18K,active,true,false
Silver Necklace,SILVER001,Elegant silver necklace,Necklaces,3000,5000,4500,15,3,100,8.5,15 x 8 x 1 cm,Silver,White,925,active,false,true`;
    
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
          <Button variant="ghost" size="sm" onClick={() => {
            resetFileInput();
            onClose();
          }}>
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
              <Label>Select CSV File</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => {
                  console.log('Upload area clicked');
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    console.log('File input found, clicking...');
                    fileInput.click();
                  } else {
                    console.log('File input not found!');
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,text/csv,application/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="space-y-4">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragOver 
                      ? 'Drop your CSV file here' 
                      : 'Drag and drop your CSV file here, or click to browse'
                    }
                  </p>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Choose File button clicked');
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput) {
                        console.log('File input found, clicking...');
                        fileInput.click();
                      } else {
                        console.log('File input not found!');
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500">
                    Only CSV files are supported
                  </p>
                </div>
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
                    <Skeleton className="mr-2 h-4 w-4 rounded" />
                    Importing...
                  </>
                ) : (
                  'Import Products'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetFileInput();
                  onClose();
                }}
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
