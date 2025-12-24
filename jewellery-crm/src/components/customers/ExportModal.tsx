// @ts-nocheck
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// @ts-ignore - TypeScript configuration: lucide-react types should be available
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';

// Local DateRange type definition (matching react-day-picker structure)
interface DateRange {
  from?: Date;
  to?: Date;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExportModal({ isOpen, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'first_name',
    'last_name',
    'email',
    'phone',
    'status',
    'lead_source',
    'created_by',
    'created_at'
  ]);

  // Only fields that exist in Add Customer Modal
  const availableFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'address', label: 'Address' },
    { key: 'full_address', label: 'Full Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'reason_for_visit', label: 'Reason for Visit' },
    { key: 'status', label: 'Status' },
    { key: 'lead_source', label: 'Lead Source' },
    { key: 'saving_scheme', label: 'Saving Scheme' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'customer_type', label: 'Customer Type' },
    { key: 'summary_notes', label: 'Summary Notes' },
    { key: 'created_by', label: 'Created By / Salesperson' },
    { key: 'created_at', label: 'Created Date' }
  ];

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields((prev: string[]) =>
      prev.includes(fieldKey)
        ? prev.filter((f: string) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map((f) => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const downloadFile = (blob: Blob, fileFormat: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().split('T')[0]}.${fileFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        fields: selectedFields,
        start_date: exportDateRange?.from ? exportDateRange.from.toISOString() : undefined,
        end_date: exportDateRange?.to ? exportDateRange.to.toISOString() : undefined,
      });

      if (response.success) {
        // The response.data is already a blob from the API service
        const blob = response.data;

        // Check if blob is valid
        if (!(blob instanceof Blob)) {
          // Try to create a blob from the data if it's a string
          if (typeof response.data === 'string') {
            const newBlob = new Blob([response.data], {
              type: format === 'csv' ? 'text/csv' : 'application/json'
            });
            downloadFile(newBlob, format);
            onSuccess();
            onClose();
            return;
          }

          setError('Invalid file data received from server');
          return;
        }

        // Download the blob
        downloadFile(blob, format);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Export Customers
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Select the format and fields you want to export
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Date Range Filter */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-primary">Filter by Date Range</Label>
                <DateRangeFilter
                  dateRange={exportDateRange}
                  onDateRangeChange={setExportDateRange}
                  placeholder="Select date range to filter customers"
                  showPresets={true}
                />
                <p className="text-xs text-text-muted">
                  {exportDateRange?.from && exportDateRange?.to
                    ? `Exporting customers from ${exportDateRange.from.toLocaleDateString()} to ${exportDateRange.to.toLocaleDateString()}`
                    : 'No date filter applied - all customers will be exported'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-primary">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                    <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fields Selection */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-text-primary">Select Fields to Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="h-8 text-xs"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4 max-h-[300px] overflow-y-auto bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    {availableFields.map((field) => (
                      <div key={field.key} className="flex items-center space-x-2 group">
                        <Checkbox
                          id={field.key}
                          checked={selectedFields.includes(field.key)}
                          onCheckedChange={() => handleFieldToggle(field.key)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label
                          htmlFor={field.key}
                          className="text-sm text-text-secondary cursor-pointer group-hover:text-text-primary transition-colors"
                        >
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  {selectedFields.length} of {availableFields.length} fields selected
                </p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
      </DialogContent>
    </Dialog>
  );
}
