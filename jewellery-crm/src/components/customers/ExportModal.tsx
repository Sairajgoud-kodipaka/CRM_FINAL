'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, X, FileText, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExportModal({ isOpen, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'first_name',
    'last_name',
    'email',
    'phone',
    'status',
    'lead_source',
    'created_at'
  ]);

  const availableFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'lead_source', label: 'Lead Source' },
    { key: 'preferred_metal', label: 'Preferred Metal' },
    { key: 'budget_range', label: 'Budget Range' },
    { key: 'customer_type', label: 'Customer Type' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'postal_code', label: 'Postal Code' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'anniversary_date', label: 'Anniversary Date' },
    { key: 'preferred_stone', label: 'Preferred Stone' },
    { key: 'ring_size', label: 'Ring Size' },
    { key: 'notes', label: 'Notes' },
    { key: 'community', label: 'Community' },
    { key: 'mother_tongue', label: 'Mother Tongue' },
    { key: 'reason_for_visit', label: 'Reason for Visit' },
    { key: 'age_of_end_user', label: 'Age of End User' },
    { key: 'saving_scheme', label: 'Saving Scheme' },
    { key: 'catchment_area', label: 'Catchment Area' },
    { key: 'next_follow_up', label: 'Next Follow Up' },
    { key: 'summary_notes', label: 'Summary Notes' },
    { key: 'customer_interests', label: 'Customer Interests' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ];

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError('Please select at least one field to export');
      return;
    }

    try {
      setExporting(true);
      setError(null);

      const response = await apiService.exportCustomers({
        format,
        fields: selectedFields
      });
      
      if (response.success) {
        // Debug: Log what we're getting
        console.log('Export response:', response);
        console.log('Response data type:', typeof response.data);
        console.log('Response data:', response.data);
        
        // The response.data is already a blob from the API service
        const blob = response.data;
        
        // Check if blob is valid
        if (!blob || !(blob instanceof Blob)) {
          console.error('Invalid blob received:', blob);
          
          // Try to create a blob from the data if it's a string
          if (typeof response.data === 'string') {
            const newBlob = new Blob([response.data], { 
              type: format === 'csv' ? 'text/csv' : 'application/json' 
            });
            const url = window.URL.createObjectURL(newBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers_export.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            onSuccess();
            onClose();
            return;
          }
          
          setError('Invalid file data received from server');
          return;
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to export customers');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export customers. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Export Customers</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-text-primary">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-text-primary">Select Fields</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={() => handleFieldToggle(field.key)}
                    />
                    <Label
                      htmlFor={field.key}
                      className="text-sm text-text-secondary cursor-pointer"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0 || exporting}
              className="flex-1 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Customers
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 