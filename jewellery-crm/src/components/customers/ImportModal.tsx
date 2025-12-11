'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, X, CheckCircle2, XCircle, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerImportData {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  assigned_to?: string;
  sales_person?: string;
  status?: string;
  catchment_area?: string;
  lead_source?: string;
  product_interest?: string;
  productInterest?: string;
  reason_for_visit?: string;
  reasonForVisit?: string;
  product_type?: string;
  productType?: string;
  date_created?: string;
  created_at?: string;
  [key: string]: any; // For other CSV columns
}

interface ImportStatus {
  index: number;
  status: 'pending' | 'creating' | 'success' | 'error';
  message?: string;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<CustomerImportData[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetImport = () => {
    setSelectedFile(null);
    setImportData([]);
    setImportStatus([]);
    setError(null);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  // Download CSV Template
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/clients/template/download/?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      // Fallback to local template
    }
    
    const headers = [
      'first_name', 'last_name', 'email', 'phone', 'customer_type',
      'address', 'city', 'state', 'country', 'postal_code',
      'date_of_birth', 'anniversary_date', 'preferred_metal', 'preferred_stone',
      'ring_size', 'budget_range', 'lead_source', 'notes', 'community',
      'mother_tongue', 'reason_for_visit', 'age_of_end_user', 'saving_scheme', 'status', 'assigned_to'
    ];
    const sampleData = [
      ['Rahul', 'Sharma', 'rahul.sharma@gmail.com', '9876543210', 'individual', '123 MG Road', 'Ahmedabad', 'Gujarat', 'India', '380001', '1990-05-15', '2015-06-20', 'Gold', 'Diamond', '16', '50000-100000', 'walk_in', 'Interested in necklaces', '', '', 'Anniversary', '30-40', '', 'general', 'admin'],
      ['Priya', 'Patel', '', '9876543211', 'individual', '456 CG Road', 'Mumbai', 'Maharashtra', 'India', '400001', '', '', 'Silver', '', '', '25000-50000', 'referral', '', '', '', 'Gift Purchase', '25-30', '', 'vip', ''],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file and show preview
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    // For now, only handle CSV files (Excel would need a library)
    if (fileExtension !== '.csv') {
      setError('Excel files (.xlsx, .xls) will be supported soon. Please use CSV for now.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('CSV file must have at least a header row and one data row');
          return;
        }

        // Parse CSV (handle quoted fields with commas - both double and single quotes)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inDoubleQuotes = false;
          let inSingleQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inDoubleQuotes = !inDoubleQuotes;
            } else if (char === "'") {
              inSingleQuotes = !inSingleQuotes;
            } else if (char === ',' && !inDoubleQuotes && !inSingleQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const parsedData: CustomerImportData[] = [];
        
        // Debug: Log headers to see what we're parsing
        console.log('CSV Headers:', headers);
        console.log('Looking for assigned_to index:', headers.indexOf('assigned_to'));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = parseCSVLine(lines[i]).map(v => {
            // Strip both double and single quotes from start/end
            let cleaned = v.replace(/^["']+|["']+$/g, '').trim();
            // Handle unclosed single quotes (common in date fields like '28-08-2025)
            if (cleaned.startsWith("'") && !cleaned.endsWith("'")) {
              cleaned = cleaned.replace(/^'+/g, '');
            }
            return cleaned;
          });
          if (values.length < headers.length) {
            // Pad with empty strings if needed
            while (values.length < headers.length) {
              values.push('');
            }
          }
          
          const row: any = {};
          headers.forEach((header, index) => {
            // Store with original header name (lowercase)
            let value = values[index] || '';
            // Additional cleanup: strip any remaining leading/trailing quotes
            value = value.replace(/^['"]+|['"]+$/g, '').trim();
            row[header] = value;
            // Also store with common variations for easier lookup
            if (header.includes('_')) {
              const spaced = header.replace(/_/g, ' ');
              row[spaced] = value;
            }
          });
          
          // Debug: Log first few rows to verify parsing
          if (i <= 3) {
            console.log(`Row ${i} - assigned_to value:`, row.assigned_to, 'Full row:', row);
          }
          
          // Handle Name field (split into first_name/last_name if needed)
          if (row.name && !row.first_name) {
            const nameParts = row.name.split(' ', 2);
            row.first_name = nameParts[0] || '';
            row.last_name = nameParts[1] || '';
          }
          
          // Map CSV columns to our data structure
          // Try multiple variations of assigned_to column name (exact match from CSV)
          // Check ALL possible variations to find the assigned_to value
          let assignedToValue = '';
          
          // Try all possible column name variations
          const assignedToKeys = [
            'assigned_to', 'assigned to', 'assigned-to', 'assignedto',
            'sales_person', 'sales person', 'sales-person', 'salesperson',
            'attended_by', 'attended by', 'attended-by', 'attendedby',
            'assigned', 'salesperson', 'attended'
          ];
          
          for (const key of assignedToKeys) {
            if (row[key] && String(row[key]).trim()) {
              assignedToValue = String(row[key]).trim();
              break; // Use first non-empty value found
            }
          }
          
          // Debug log for first few rows
          if (i <= 3 && assignedToValue) {
            console.log(`Row ${i}: Found assigned_to = "${assignedToValue}"`);
          }
          
          // Get customer name - use first_name + last_name, properly formatted
          const firstName = (row.first_name || row['first name'] || '').trim();
          const lastName = (row.last_name || row['last name'] || '').trim();
          const fullName = firstName && lastName ? `${firstName} ${lastName}`.trim() : 
                          firstName || lastName || (row.name || '').trim() || '';
          
          // Build customer data object - preserve exact CSV values
          const customerData: CustomerImportData = {
            first_name: firstName,
            last_name: lastName,
            name: fullName,
            email: (row.email || '').trim(),
            phone: (row.phone || row['mobile no'] || row['mobile_no'] || row['mobile'] || '').trim(),
            city: (row.city || '').trim(),
            state: (row.state || '').trim(),
            assigned_to: assignedToValue, // EXACT value from CSV - preserve as-is
            sales_person: assignedToValue, // For display - same as assigned_to
            status: (row.status || 'general').trim(),
            catchment_area: (row.catchment_area || row['catchment area'] || row['catchment_area'] || row.area || '').trim(),
            lead_source: (row.lead_source || row['lead source'] || row['lead_source'] || '').trim(),
            product_interest: (row.product_interest || row['product interest'] || row['product_interest'] || '').trim(),
            reason_for_visit: (row.reason_for_visit || row['reason for visit'] || row['reason_for_visit'] || '').trim(),
            product_type: (row.product_type || row['product type'] || row['product_type'] || '').trim(),
            date_created: (row.date_created || row['date created'] || row['date_created'] || row.created_at || row['created_at'] || '').trim().replace(/^['"]+|['"]+$/g, ''),
            // Explicitly preserve created_at from CSV if it exists - strip quotes (handles unclosed quotes)
            created_at: (row.created_at || row['created_at'] || '').trim().replace(/^['"]+|['"]+$/g, ''),
          };
          
          // Include all other CSV fields (but don't overwrite our mapped fields)
          Object.entries(row).forEach(([key, value]) => {
            if (!customerData.hasOwnProperty(key)) {
              customerData[key] = typeof value === 'string' ? value.trim() : value;
            }
          });
          
          // Ensure created_at is preserved from CSV if date_created wasn't found
          if (!customerData.date_created && customerData.created_at) {
            customerData.date_created = customerData.created_at;
          }
          
          parsedData.push(customerData);
        }
        
        if (parsedData.length === 0) {
          setError('No valid data rows found in CSV file');
          return;
        }
        
        setImportData(parsedData);
        setImportStatus(parsedData.map((_, index) => ({ index, status: 'pending' })));
        setSelectedFile(file);
        setError(null);
      } catch (err: any) {
        setError(`Error parsing CSV file: ${err.message}`);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Import customers one by one with live status
  const handleBulkImport = async () => {
    if (importData.length === 0) return;
    
    setIsImporting(true);
    setError(null);
    
    let successCount = 0;
    
    for (let i = 0; i < importData.length; i++) {
      const customer = importData[i];
      
      // Update status to creating
      setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'creating' } : s));
      
      try {
        // Prepare customer data
        // Priority: assigned_to > sales_person (both should be username from CSV)
        const assignedToValue = (customer.assigned_to || customer.sales_person || '').trim();
        
        // Map all CSV fields and provide defaults for required fields
        // Helper function to check if a value is empty after trimming
        const isEmpty = (val: any) => !val || (typeof val === 'string' && val.trim() === '');
        
        // Parse date_created if present - convert to ISO format for backend
        let created_at: string | null = null;
        // Check both date_created and created_at fields, and also check raw CSV fields
        const dateStr = customer.date_created || customer.created_at || (customer as any).created_at || (customer as any).date_created;
        console.log(`[DATE PARSE] Checking date for ${customer.first_name}:`, {
          date_created: customer.date_created,
          created_at: customer.created_at,
          raw: (customer as any).created_at,
          dateStr
        });
        
        if (dateStr && typeof dateStr === 'string') {
          // Strip any leading/trailing quotes (single or double) from date string
          let trimmedDateStr = dateStr.trim().replace(/^['"]+|['"]+$/g, '');
          if (trimmedDateStr && trimmedDateStr !== 'NULL' && trimmedDateStr !== 'null') {
            try {
              // Try to parse various date formats
              let year: string = '';
              let month: string = '';
              let day: string = '';
              let dateMatch: RegExpMatchArray | null = null;
              
              // First try: YYYY-MM-DD or YYYY/MM/DD (year first)
              dateMatch = trimmedDateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
              
              if (dateMatch) {
                [, year, month, day] = dateMatch;
                console.log(`✅ [DATE PARSE] Matched YYYY-MM-DD format: year=${year}, month=${month}, day=${day}`);
              } else {
                // Second try: DD-MM-YYYY or DD/MM/YYYY (day first - common in Indian format)
                // Use ^ and $ anchors to ensure full string match
                dateMatch = trimmedDateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
                if (dateMatch) {
                  [, day, month, year] = dateMatch;
                  console.log(`✅ [DATE PARSE] Matched DD-MM-YYYY format: day=${day}, month=${month}, year=${year}`);
                } else {
                  // Third try: More flexible pattern without anchors (in case of extra whitespace)
                  dateMatch = trimmedDateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
                  if (dateMatch) {
                    [, day, month, year] = dateMatch;
                    console.log(`✅ [DATE PARSE] Matched DD-MM-YYYY format (flexible): day=${day}, month=${month}, year=${year}`);
                  }
                }
              }
              
              if (dateMatch && year && month && day) {
                // Validate the date
                const monthNum = parseInt(month);
                const dayNum = parseInt(day);
                const yearNum = parseInt(year);
                
                // Basic validation
                if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= 2100) {
                  // Send date as DD-MM-YYYY format - backend will parse it
                  // Format: DD-MM-YYYY (e.g., "28-08-2025")
                  const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
                  created_at = formattedDate;
                  console.log(`✅ [DATE PARSE] Successfully parsed date: ${trimmedDateStr} -> ${formattedDate} (sending as DD-MM-YYYY to backend)`);
                } else {
                  console.warn(`❌ [DATE PARSE] Invalid date values: year=${yearNum}, month=${monthNum}, day=${dayNum}`);
                }
              } else {
                // If no match, try to send the date as-is if it looks like DD-MM-YYYY
                if (trimmedDateStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
                  created_at = trimmedDateStr.replace(/\//g, '-'); // Convert slashes to dashes
                  console.log(`✅ [DATE PARSE] Sending date as-is (DD-MM-YYYY): ${created_at}`);
                } else {
                  console.warn(`❌ [DATE PARSE] Date format not recognized: ${trimmedDateStr}`);
                }
              }
            } catch (e) {
              console.warn(`❌ [DATE PARSE] Could not parse date: ${trimmedDateStr}`, e);
            }
          } else {
            console.warn(`⚠️ [DATE PARSE] Date string is empty or NULL: ${trimmedDateStr}`);
          }
        } else {
          console.warn(`⚠️ [DATE PARSE] No date string found for ${customer.first_name}`);
        }
        
        // For required fields, use "Not Specified" if empty to satisfy backend validation
        const customerData: any = {
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || undefined,
          phone: customer.phone || '',
          city: isEmpty(customer.city) ? 'Not Specified' : customer.city,
          state: isEmpty(customer.state) ? 'Not Specified' : customer.state,
          status: customer.status || 'general',
          catchment_area: isEmpty(customer.catchment_area) ? 'Not Specified' : customer.catchment_area,
          lead_source: isEmpty(customer.lead_source) ? 'Not Specified' : customer.lead_source,
          // Map sales_person from assigned_to if available
          sales_person: isEmpty(assignedToValue) ? 'Not Specified' : assignedToValue,
          // Provide defaults for required fields that might be missing
          reason_for_visit: isEmpty(customer.reason_for_visit) && isEmpty(customer.reasonForVisit) 
            ? 'Not Specified' 
            : (customer.reason_for_visit || customer.reasonForVisit),
          product_type: isEmpty(customer.product_type) && isEmpty(customer.productType)
            ? 'Not Specified'
            : (customer.product_type || customer.productType),
          // Include created_at if we parsed a date
          ...(created_at ? { created_at } : {}),
          // For customer_interests_input, create a default entry with 0 revenue if product_interest exists
          customer_interests_input: [],
        };
        
        // If product_interest exists in CSV, create a customer interest entry
        if (customer.product_interest || customer.productInterest) {
          const productInterest = customer.product_interest || customer.productInterest;
          customerData.customer_interests_input = [JSON.stringify({
            category: 'General',
            products: [{
              product: productInterest,
              revenue: '0'
            }],
            preferences: {}
          })];
        } else {
          // Provide default empty interest with 0 revenue to satisfy validation
          customerData.customer_interests_input = [JSON.stringify({
            category: 'General',
            products: [{
              product: 'Not Specified',
              revenue: '0'
            }],
            preferences: {}
          })];
        }
        
        // Only add assigned_to if it has a value (username from CSV)
        if (assignedToValue) {
          customerData.assigned_to = assignedToValue; // Backend will look up user by username
        }
        
        // Remove undefined values but keep empty strings for required fields
        // BUT preserve created_at even if it seems undefined (it's a string)
        const preservedCreatedAt = customerData.created_at;
        Object.keys(customerData).forEach(key => {
          if (customerData[key] === undefined) {
            delete customerData[key];
          }
        });
        // Re-add created_at if it was present
        if (preservedCreatedAt) {
          customerData.created_at = preservedCreatedAt;
        }
        
        // Final check: Ensure created_at is explicitly included if we have it
        if (created_at) {
          customerData.created_at = created_at;
          console.log(`✅ [IMPORT] Sending created_at for ${customer.first_name}: ${created_at}`);
        } else {
          console.warn(`⚠️ [IMPORT] No created_at for ${customer.first_name} - date_created was: ${customer.date_created}, created_at was: ${customer.created_at}`);
        }
        
        console.log(`📤 [IMPORT] Full customerData being sent for ${customer.first_name}:`, JSON.stringify(customerData, null, 2));
        
        const response = await apiService.createClient(customerData);
        
        if (response.success) {
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'success' } : s));
          successCount++;
        } else {
          const errorMsg = response.message || 'Failed to import';
          setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: errorMsg } : s));
        }
      } catch (err: any) {
        setImportStatus(prev => prev.map(s => s.index === i ? { ...s, status: 'error', message: err.message || 'Error importing customer' } : s));
      }
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsImporting(false);
    
    if (successCount > 0) {
      onSuccess();
    }
  };

  const getCustomerName = (customer: CustomerImportData) => {
    if (customer.name) return customer.name;
    if (customer.first_name || customer.last_name) {
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    }
    return 'Unnamed Customer';
  };

  const getSalesPerson = (customer: CustomerImportData) => {
    // Show the EXACT assigned_to value from CSV (username) - no transformation
    // Check in order: assigned_to (from our mapping) > sales_person > raw CSV field
    const assigned = customer.assigned_to || 
                     customer.sales_person || 
                     (customer as any).assigned_to || // Direct from CSV
                     '';
    // Return exactly as it appears in CSV (trimmed, but preserve case and format)
    return String(assigned).trim() || '-';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Import Customers</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* CSV Format Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format</h4>
            <p className="text-sm text-blue-800 mb-2">
              Upload a CSV file with the following columns:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="bg-white text-xs">first_name*</Badge>
              <Badge variant="outline" className="bg-white text-xs">phone*</Badge>
              <Badge variant="outline" className="bg-white text-xs">email</Badge>
              <Badge variant="outline" className="bg-white text-xs">city</Badge>
              <Badge variant="outline" className="bg-white text-xs">assigned_to</Badge>
              <Badge variant="outline" className="bg-white text-xs opacity-60">+ more</Badge>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              <strong>Required:</strong> Either email OR phone must be provided for each row.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadTemplate}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" /> Download Template
            </Button>
          </div>

          {/* File Upload */}
          {importData.length === 0 && (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
              }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="w-10 h-10 text-green-500 mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button variant="ghost" size="sm" onClick={resetImport} disabled={isImporting}>
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mb-3">CSV files</p>
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      Select File
                    </label>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Preview Table */}
          {importData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <span className="text-sm font-medium">{importData.length} customers to import</span>
                <Button variant="ghost" size="sm" onClick={resetImport} disabled={isImporting}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sales Person</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">City</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importData.map((customer, index) => {
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
                          <td className="px-3 py-2">
                            <div className="font-medium">{getCustomerName(customer)}</div>
                            {status?.status === 'error' && status.message && (
                              <div className="text-xs text-red-500 mt-1">{status.message}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{customer.email || '-'}</td>
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs">{customer.phone || '-'}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {getSalesPerson(customer)}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{customer.city || '-'}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {customer.status || 'general'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-800">
                  Importing... {importStatus.filter(s => s.status === 'success' || s.status === 'error').length} of {importData.length} completed
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {importData.length > 0 && !isImporting && (
              <Button
                onClick={handleBulkImport}
                disabled={isImporting}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Create {importData.length} Account{importData.length !== 1 ? 's' : ''}
              </Button>
            )}
            {isImporting && (
              <Button
                disabled
                className="flex-1"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </Button>
            )}
            {importData.length > 0 && !isImporting && importStatus.some(s => s.status === 'success' || s.status === 'error') && (
              <Button
                variant="outline"
                onClick={resetImport}
                className="flex-1"
              >
                Import Another File
              </Button>
            )}
            <Button
              variant={importData.length > 0 ? 'outline' : 'default'}
              onClick={handleClose}
              disabled={isImporting}
            >
              {importData.length > 0 && importStatus.some(s => s.status === 'success' || s.status === 'error') ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
