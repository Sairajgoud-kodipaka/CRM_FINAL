'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, X, FileText, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importResults, setImportResults] = useState<{ imported: number; failed: number; errors?: string[] } | null>(null);

  const resetState = () => {
    setFile(null);
    setUploading(false);
    setError(null);
    setSuccess(false);
    setImportResults(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const downloadTemplate = async (type: 'csv' | 'xlsx') => {
    try {
      // Call backend API to get the template
      const response = await fetch(`/api/clients/clients/template/download/?format=${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_import_template.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download template');
        // Fallback to local generation for CSV
        if (type === 'csv') {
          const headers = [
            'first_name',
            'last_name', 
            'email',
            'phone',
            'address',
            'city',
            'state',
            'country'
          ];

          // Create sample data row to show the format
          const sampleData = [
            'John',
            'Doe',
            'john.doe@example.com',
            '+1234567890',
            '123 Main Street',
            'New York',
            'NY',
            'USA'
          ];

          const csvContent = headers.join(',') + '\n' + sampleData.join(',') + '\n';
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'customers_import_template.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      // Fallback to local generation for CSV
      if (type === 'csv') {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'city',
      'state',
          'country'
        ];

        // Create sample data row to show the format
        const sampleData = [
          'John',
          'Doe',
          'john.doe@example.com',
          '+1234567890',
          '123 Main Street',
          'New York',
          'NY',
          'USA'
        ];

        const csvContent = headers.join(',') + '\n' + sampleData.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accept CSV, XLSX, and XLS files
      const validTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'application/octet-stream' // Some systems may use this for Excel files
      ];
      
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const hasValidType = validTypes.includes(selectedFile.type);
      const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (hasValidType || hasValidExtension) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid file (CSV, XLSX, or XLS)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Size:', file.size);

      const response = await apiService.importCustomers(formData);
      
      console.log('Import response:', response);
      
      if (response.success) {
        setSuccess(true);
        setImportResults(response.data);
        // Show more detailed success information
        const importedCount = response.data?.imported || 0;
        const failedCount = response.data?.failed || 0;
        
        if (importedCount > 0) {
          console.log(`Successfully imported ${importedCount} customers`);
        }
        
        if (failedCount > 0) {
          console.warn(`${failedCount} customers failed to import`);
          // Show errors even if some customers were imported
          if (response.data?.errors && response.data.errors.length > 0) {
            setImportResults({
              imported: importedCount,
              failed: failedCount,
              errors: response.data.errors
            });
            setSuccess(true);
            return; // Don't close modal yet, let user see the errors
          }
        }
        
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        console.error('Import failed:', response);
        setError(response.message || 'Failed to import customers. Please check the console for details.');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(`Failed to import customers: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Import Customers</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            💡 <strong>Simple Import:</strong> Import customers with just basic info (name, contact, address). 
            You can add more details later using the edit modal.
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Import Successful!</h3>
            <p className="text-text-secondary">Basic customer information has been imported successfully.</p>
            {importResults && (
              <div className="mt-4 text-sm text-text-secondary">
                <p><strong>Imported:</strong> {importResults.imported} customers</p>
                <p><strong>Failed:</strong> {importResults.failed} customers</p>
                {importResults?.errors && importResults.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Errors:</p>
                    <ul className="text-xs text-red-600 mt-1 max-h-32 overflow-y-auto space-y-1">
                      {importResults.errors.map((error, index) => (
                        <li key={index} className="break-words">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Next Step:</strong> Use the edit modal to add more details like preferences, 
                budget, and other information for each customer.
              </p>
            </div>
            
            {importResults?.errors && importResults.errors.length > 0 && (
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSuccess(false);
                    setImportResults(null);
                    setFile(null);
                  }}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file" className="text-sm font-medium text-text-primary">
                  Upload CSV File
                </Label>
                <div className="mt-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                    <FileText className="w-4 h-4" />
                    {file.name}
                  </div>
                )}
                <p className="text-xs text-text-secondary mt-1">
                  Only essential fields are required. All other details can be added later in the edit modal. 
                  Supports CSV, XLSX, and XLS files. Download the template below for the correct format.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <div className="text-sm text-red-600">
                    <p>{error}</p>
                    <p className="text-xs mt-1">Check the browser console for more details.</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplate('csv')}
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV Template
                  </Button>
                <Button
                  variant="outline"
                    onClick={() => downloadTemplate('xlsx')}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                    Download Excel Template
                </Button>
                </div>
                <p className="text-xs text-text-secondary mt-2 text-center">
                  Template includes: Name, Email, Phone, Address fields only. 
                  Works with CSV, XLSX, and XLS files.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Customers
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 