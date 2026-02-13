'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, X, CheckCircle2, XCircle, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEFAULT_MAX_BATCH_SIZE = 10000;
const ERROR_LIST_PAGE_SIZE = 50;

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'validating' | 'report' | 'importing' | 'offer_failed_only';

interface ValidationError {
  row: number;
  message: string;
  code: string;
  field?: string;
}

interface ValidationReport {
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  needs_attention_count: number;
  already_exists_count?: number;
  errors: ValidationError[];
  max_batch_size?: number;
}

interface ImportAuditItem {
  id: number;
  action: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  needs_attention_count: number;
  imported_count: number | null;
  failed_count: number | null;
  created_at: string | null;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [salespersonOption, setSalespersonOption] = useState<'skip' | 'name_only' | 'auto_create'>('name_only');
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped?: number; visits_added?: number; failed: number; errors: string[] } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [detailFilter, setDetailFilter] = useState<'all' | 'valid' | 'needs_attention' | 'invalid' | 'already_exists'>(() => 'all');
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [errorListPage, setErrorListPage] = useState(0);
  const [recentAudits, setRecentAudits] = useState<ImportAuditItem[]>([]);
  const [maxBatchSize, setMaxBatchSize] = useState(DEFAULT_MAX_BATCH_SIZE);
  const [validationProgress, setValidationProgress] = useState<{
    processed: number;
    total: number;
    valid_count: number;
    invalid_count: number;
    needs_attention_count: number;
    already_exists_count?: number;
  } | null>(null);
  const [validationStartTime, setValidationStartTime] = useState<number | null>(null);
  const [validationElapsedSeconds, setValidationElapsedSeconds] = useState(0);
  const [importStartTime, setImportStartTime] = useState<number | null>(null);
  const [importElapsedSeconds, setImportElapsedSeconds] = useState(0);
  const [importTotalRows, setImportTotalRows] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState<{
    processed: number;
    total: number;
    imported: number;
    skipped: number;
    failed: number;
    row_num?: number;
    name?: string;
    error?: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Context for re-importing only failed rows when the same file is chosen again
  const [previousImportFileKey, setPreviousImportFileKey] = useState<string | null>(null);
  const [previousImportFailedRows, setPreviousImportFailedRows] = useState<number[]>([]);

  const resetImport = () => {
    setStep('upload');
    setSelectedFile(null);
    setValidationReport(null);
    setValidationProgress(null);
    setSalespersonOption('name_only');
    setError(null);
    setImportResult(null);
    setShowConfirmDialog(false);
    setDetailFilter('all');
    setShowAllErrors(false);
    setErrorListPage(0);
    setPreviousImportFileKey(null);
    setPreviousImportFailedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAndChooseNewFile = () => {
    setSelectedFile(null);
    setValidationReport(null);
    setImportResult(null);
    setError(null);
    setDetailFilter('all');
    setShowAllErrors(false);
    setErrorListPage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      apiService.getImportAudits(5).then((res) => {
        if (res.success && res.data?.results) {
          setRecentAudits(res.data.results);
          if (typeof res.data.max_batch_size === 'number') setMaxBatchSize(res.data.max_batch_size);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    setErrorListPage(0);
    setShowAllErrors(false);
  }, [detailFilter]);

  // Lightweight client-side timers for validation and import (no extra server calls)
  useEffect(() => {
    if (step !== 'validating' || !validationStartTime) return;
    setValidationElapsedSeconds(0);
    const timerId = window.setInterval(() => {
      setValidationElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [step, validationStartTime]);

  useEffect(() => {
    if (step !== 'importing' || !importStartTime) return;
    const timerId = window.setInterval(() => {
      setImportElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, [step, importStartTime]);

  const formatDuration = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${mm} mins : ${ss} secs`;
  };

  const getValidationEtaText = () => {
    if (!validationProgress || !validationStartTime) return null;
    if (!validationProgress.total || !validationProgress.processed) return null;
    if (validationElapsedSeconds < 3) return null; // wait a few seconds for a stable rate

    const rowsPerSecond = validationProgress.processed / Math.max(1, validationElapsedSeconds);
    if (rowsPerSecond <= 0) return null;

    const remainingRows = Math.max(0, validationProgress.total - validationProgress.processed);
    if (remainingRows === 0) return null;

    const remainingSeconds = remainingRows / rowsPerSecond;
    return formatDuration(remainingSeconds);
  };

  const getImportEtaText = () => {
    if (!importStartTime || !importProgress || !importProgress.total) return null;
    if (step !== 'importing') return null;
    if (importElapsedSeconds < 3 || importProgress.processed <= 0) return null;
    const rowsPerSecond = importProgress.processed / Math.max(1, importElapsedSeconds);
    if (rowsPerSecond <= 0) return null;
    const remainingRows = Math.max(0, importProgress.total - importProgress.processed);
    if (remainingRows === 0) return null;
    const remainingSeconds = remainingRows / rowsPerSecond;
    return formatDuration(remainingSeconds);
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/clients/template/download/?format=csv', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
    } catch {
      // Fallback: minimal template
    }
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'city',
      'state',
      'assigned_to',
      'status',
      'lead_source',
      'reason_for_visit',
    ];
    const sample = [['Rahul', 'Sharma', 'rahul@example.com', '9876543210', 'Ahmedabad', 'Gujarat', 'admin', 'general', 'walk_in', 'Purchase']];
    const csv = [headers.join(','), ...sample.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.');
      return;
    }

    const fileKey = `${file.name}-${file.size}`;
    if (previousImportFileKey === fileKey && previousImportFailedRows.length > 0) {
      setError(null);
      setSelectedFile(file);
      setStep('offer_failed_only');
      event.target.value = '';
      return;
    }

    setError(null);
    setSelectedFile(file);
    setValidationProgress({ processed: 0, total: 0, valid_count: 0, invalid_count: 0, needs_attention_count: 0, already_exists_count: 0 });
    setValidationStartTime(Date.now());
    setStep('validating');

    try {
      const report = await apiService.validateImportStreaming(file, (data) => {
        setValidationProgress({
          processed: data.processed,
          total: data.total,
          valid_count: data.valid_count,
          invalid_count: data.invalid_count,
          needs_attention_count: data.needs_attention_count,
          already_exists_count: data.already_exists_count ?? 0,
        });
      });
      setValidationReport(report);
      if (report && typeof (report as { max_batch_size?: number }).max_batch_size === 'number') {
        setMaxBatchSize((report as { max_batch_size: number }).max_batch_size);
      }
      setValidationProgress(null);
      setShowAllErrors(false);
      setErrorListPage(0);
      setStep('report');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed.');
      setValidationProgress(null);
      setValidationStartTime(null);
      setStep('upload');
    }
    event.target.value = '';
  };

  const importableCount = validationReport
    ? validationReport.valid_count + validationReport.needs_attention_count
    : 0;

  const filteredValidationErrors = React.useMemo(() => {
    if (!validationReport?.errors.length) return [];
    if (detailFilter === 'all') return validationReport.errors;
    if (detailFilter === 'invalid') return validationReport.errors.filter(e => e.code === 'required_field');
    if (detailFilter === 'already_exists') return validationReport.errors.filter(e => e.code === 'already_exists');
    if (detailFilter === 'needs_attention') return validationReport.errors.filter(e => e.code === 'salesperson_not_found');
    if (detailFilter === 'valid') return [];
    return validationReport.errors;
  }, [validationReport?.errors, detailFilter]);

  const errorRowsSet = React.useMemo(() => {
    if (!validationReport?.errors?.length) return new Set<number>();
    return new Set(validationReport.errors.map((e) => e.row));
  }, [validationReport?.errors]);

  const validRowNumbers = React.useMemo(() => {
    if (!validationReport) return [];
    const total = validationReport.total_rows;
    const headerRow = 1;
    const rows: number[] = [];
    for (let r = headerRow + 1; r <= headerRow + total; r++) {
      if (!errorRowsSet.has(r)) rows.push(r);
    }
    return rows;
  }, [validationReport, errorRowsSet]);

  const paginatedErrors = React.useMemo(() => {
    const list = filteredValidationErrors;
    if (showAllErrors || list.length <= ERROR_LIST_PAGE_SIZE) return list;
    const start = errorListPage * ERROR_LIST_PAGE_SIZE;
    return list.slice(start, start + ERROR_LIST_PAGE_SIZE);
  }, [filteredValidationErrors, showAllErrors, errorListPage]);

  const totalErrorPages = Math.ceil(filteredValidationErrors.length / ERROR_LIST_PAGE_SIZE);
  const canShowMore = filteredValidationErrors.length > ERROR_LIST_PAGE_SIZE && !showAllErrors;

  /** Problems summary: group errors by code for a clear "what's wrong" list */
  const problemsList = React.useMemo(() => {
    if (!validationReport?.errors?.length) return [];
    const byCode: Record<string, { count: number; label: string; description: string }> = {};
    const labels: Record<string, string> = {
      required_field: 'Missing email or phone',
      duplicate: 'Customer already exists',
      already_exists: 'Customer already exists',
      salesperson_not_found: 'Salesperson not found',
    };
    const descriptions: Record<string, string> = {
      required_field: 'Each row must have either email or phone. Add at least one and re-upload.',
      duplicate: 'A customer with this email or phone already exists. Remove or update the row.',
      already_exists: 'These customers already exist in the system and will be skipped during import.',
      salesperson_not_found: 'Assigned salesperson username is not in the system. Choose an option below or fix the name.',
    };
    for (const e of validationReport.errors) {
      const code = e.code || 'unknown';
      if (!byCode[code]) {
        byCode[code] = { count: 0, label: labels[code] || code, description: descriptions[code] || e.message };
      }
      byCode[code].count += 1;
    }
    return Object.entries(byCode).map(([code, { count, label, description }]) => ({ code, count, label, description }));
  }, [validationReport?.errors]);

  const handleImportClick = () => {
    if (!selectedFile || importableCount <= 0) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirmDialog(false);
    if (!selectedFile) return;

    // Real import progress comes from backend streaming
    const totalToImport = importableCount || validationReport?.total_rows || null;
    setImportTotalRows(totalToImport);
    setImportProgress({
      processed: 0,
      total: totalToImport ?? 0,
      imported: 0,
      skipped: 0,
      failed: 0,
    });
    setStep('importing');
    setImportStartTime(Date.now());
    setImportElapsedSeconds(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const summary = await apiService.importCustomersStreaming(
        formData,
        {
          confirm: true,
          salesperson_not_found: salespersonOption,
        },
        (progress) => {
          setImportProgress(progress);
        }
      );

      const data = {
        imported: summary.imported,
        failed: summary.failed,
        errors: summary.errors,
        skipped: summary.skipped,
        visits_added: summary.visits_added ?? 0,
      };
      setImportResult(data);
      if (data.imported > 0) onSuccess();
      // Store context for re-importing only failed rows when the same file is chosen again
      if (data.failed > 0 && data.errors?.length && selectedFile) {
        const failedRows = Array.from(
          new Set(
            data.errors
              .map((msg) => {
                const m = msg.match(/^Row (\d+):/);
                return m ? parseInt(m[1], 10) : 0;
              })
              .filter((n) => n > 0)
          )
        ).sort((a, b) => a - b);
        if (failedRows.length > 0) {
          setPreviousImportFileKey(`${selectedFile.name}-${selectedFile.size}`);
          setPreviousImportFailedRows(failedRows);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    }
    setStep('report');
  };

  const handleImportAnother = () => {
    setStep('upload');
    setImportResult(null);
    setError(null);
  };

  const handleImportFailedRowsOnly = async () => {
    if (!selectedFile || previousImportFailedRows.length === 0) return;
    setError(null);
    setStep('importing');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await apiService.importCustomers(formData, {
        confirm: true,
        salesperson_not_found: salespersonOption,
        only_rows: previousImportFailedRows,
      });
      if (res.success && res.data) {
        const data = res.data as { imported: number; failed: number; errors: string[] };
        setImportResult(data);
        if (data.imported > 0) onSuccess();
        if (data.failed > 0 && data.errors?.length) {
          const failedRows = Array.from(
            new Set(
              data.errors
                .map((msg) => {
                  const m = msg.match(/^Row (\d+):/);
                  return m ? parseInt(m[1], 10) : 0;
                })
                .filter((n) => n > 0)
            )
          ).sort((a, b) => a - b);
          if (failedRows.length > 0) {
            setPreviousImportFileKey(`${selectedFile.name}-${selectedFile.size}`);
            setPreviousImportFailedRows(failedRows);
          } else {
            setPreviousImportFailedRows([]);
          }
        } else {
          setPreviousImportFailedRows([]);
        }
      } else {
        setError(res.message || 'Import failed.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    }
    setStep('report');
  };

  const handleValidateAgain = async () => {
    if (!selectedFile) return;
    setError(null);
    setValidationProgress({ processed: 0, total: 0, valid_count: 0, invalid_count: 0, needs_attention_count: 0, already_exists_count: 0 });
    setValidationStartTime(Date.now());
    setStep('validating');
    try {
      const report = await apiService.validateImportStreaming(selectedFile, (data) => {
        setValidationProgress({
          processed: data.processed,
          total: data.total,
          valid_count: data.valid_count,
          invalid_count: data.invalid_count,
          needs_attention_count: data.needs_attention_count,
        });
      });
      setValidationReport(report);
      if (report && typeof (report as { max_batch_size?: number }).max_batch_size === 'number') {
        setMaxBatchSize((report as { max_batch_size: number }).max_batch_size);
      }
      setValidationProgress(null);
      setShowAllErrors(false);
      setErrorListPage(0);
      setStep('report');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed.');
      setValidationProgress(null);
      setValidationStartTime(null);
      setStep('upload');
    }
  };

  const copyValidRowNumbers = () => {
    if (validRowNumbers.length === 0) return;
    navigator.clipboard.writeText(validRowNumbers.join(', '));
  };

  const downloadValidationReport = () => {
    if (!validationReport) return;
    const headers = ['row', 'code', 'field', 'message'];
    const rows = validationReport.errors.map((e) => [
      e.row,
      e.code || '',
      e.field || '',
      (e.message || '').replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c)}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_validation_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /** Unique salesperson names from the file that are NOT in the system (for "check" section) */
  const salespersonsNotInSystem = React.useMemo(() => {
    if (!validationReport?.errors?.length) return [];
    const names = new Set<string>();
    for (const e of validationReport.errors) {
      if (e.code !== 'salesperson_not_found') continue;
      const match = (e.message || '').match(/Salesperson\s+"([^"]+)"/i) || (e.message || '').match(/"([^"]+)"\s+not found/i);
      if (match) names.add(match[1].trim());
    }
    return Array.from(names).sort();
  }, [validationReport?.errors]);

  const groupedImportErrors = React.useMemo(() => {
    if (!importResult?.errors?.length) return [];
    const byRow: Array<{ row: number; messages: string[] }> = [];
    const rowMap = new Map<number, string[]>();
    for (const msg of importResult.errors) {
      const m = msg.match(/^Row (\d+):\s*(.*)$/);
      const row = m ? parseInt(m[1], 10) : 0;
      const text = m ? m[2] : msg;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
        byRow.push({ row, messages: rowMap.get(row)! });
      }
      rowMap.get(row)!.push(text);
    }
    byRow.sort((a, b) => a.row - b.row);
    return byRow;
  }, [importResult?.errors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Customers</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {recentAudits.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Recent imports</p>
                <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                  {recentAudits.map((a) => (
                    <li key={a.id} className="flex flex-wrap gap-x-2 gap-y-0 text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {a.action === 'imported' ? 'Imported' : 'Validated'}
                      </span>
                      <span>{a.total_rows} rows</span>
                      {a.action === 'imported' && (
                        <span className="text-green-600 dark:text-green-400">{a.imported_count ?? 0} ok</span>
                      )}
                      {(a.invalid_count > 0 || a.needs_attention_count > 0) && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {a.invalid_count + a.needs_attention_count} issues
                        </span>
                      )}
                      {a.created_at && (
                        <span className="text-gray-500">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Imports are limited to a maximum of <strong>10,000</strong> rows per file. If your dataset exceeds this limit, please split it into smaller files so each import contains no more than 10,000 rows.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                Required: <strong>email</strong> or <strong>phone</strong> per row. Optional: <strong>assigned_to</strong> (salesperson username).
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-2">
                <Download className="w-3 h-3 mr-1" /> Download Template
              </Button>
            </div>
            {selectedFile && validationReport && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-green-800 dark:text-green-200">Previous file: <strong>{selectedFile.name}</strong></span>
                <Button variant="outline" size="sm" onClick={handleValidateAgain}>
                  Validate again
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAndChooseNewFile}>
                  Choose new file
                </Button>
              </div>
            )}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                selectedFile && !validationReport ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary'
              }`}
            >
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mb-3">CSV, XLSX, or XLS (max {maxBatchSize} rows)</p>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  Select File
                </label>
              </Button>
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Same file re-selected: offer to import only failed rows */}
        {step === 'offer_failed_only' && selectedFile && previousImportFailedRows.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                This file was already imported
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{previousImportFailedRows.length}</strong> row(s) failed last time. Import only the failed row(s) now—no need to re-validate or re-import the rest.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleImportFailedRowsOnly}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import only {previousImportFailedRows.length} failed row{previousImportFailedRows.length !== 1 ? 's' : ''}
              </Button>
              <Button variant="outline" onClick={handleValidateAgain}>
                Validate full file
              </Button>
              <Button variant="ghost" onClick={clearAndChooseNewFile}>
                Choose new file
              </Button>
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Validating – real-time progress */}
        {step === 'validating' && (
          <div className="py-8 space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-10 h-10 text-primary animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Validating rows… {validationProgress && validationProgress.total > 0
                    ? `${validationProgress.processed} of ${validationProgress.total}`
                    : 'starting…'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rows are checked as they’re processed; counts update in real time.
                </p>
                {(validationProgress && validationProgress.total > 0 && validationProgress.processed > 0) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Time elapsed: {formatDuration(validationElapsedSeconds)}
                    {getValidationEtaText() && (
                      <> • Estimated time left: {getValidationEtaText()}</>
                    )}
                  </p>
                )}
              </div>
            </div>
            {validationProgress && validationProgress.total > 0 && (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{
                      width: `${Math.min(100, (100 * validationProgress.processed) / validationProgress.total)}%`,
                    }}
                  />
                </div>
                <div className={`grid gap-2 text-center ${(validationProgress.already_exists_count ?? 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-2">
                    <span className="text-lg font-semibold text-green-700 dark:text-green-300">{validationProgress.valid_count}</span>
                    <p className="text-xs text-green-600 dark:text-green-400">Valid</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-2">
                    <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">{validationProgress.needs_attention_count}</span>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Need attention</p>
                  </div>
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2">
                    <span className="text-lg font-semibold text-red-700 dark:text-red-300">{validationProgress.invalid_count}</span>
                    <p className="text-xs text-red-600 dark:text-red-400">Invalid</p>
                  </div>
                  {(validationProgress.already_exists_count ?? 0) > 0 && (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-2">
                      <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">{validationProgress.already_exists_count}</span>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Already exist</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Validation report */}
        {(step === 'report' || step === 'importing') && validationReport && (
          <div className="space-y-4">
            {/* Summary – click a card to filter detailed rows */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => setDetailFilter(detailFilter === 'valid' ? 'all' : 'valid')}
                className={`text-left rounded-lg p-3 border transition-all ${
                  detailFilter === 'valid'
                    ? 'bg-green-100 dark:bg-green-900/40 border-green-400 dark:border-green-600 ring-2 ring-green-500/50'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400'
                }`}
              >
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{validationReport.valid_count}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Valid — click for details</div>
              </button>
              <button
                type="button"
                onClick={() => setDetailFilter(detailFilter === 'needs_attention' ? 'all' : 'needs_attention')}
                className={`text-left rounded-lg p-3 border transition-all ${
                  detailFilter === 'needs_attention'
                    ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/50'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                }`}
              >
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{validationReport.needs_attention_count}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Need attention — click for details</div>
              </button>
              <button
                type="button"
                onClick={() => setDetailFilter(detailFilter === 'invalid' ? 'all' : 'invalid')}
                className={`text-left rounded-lg p-3 border transition-all ${
                  detailFilter === 'invalid'
                    ? 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600 ring-2 ring-red-500/50'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-400'
                }`}
              >
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{validationReport.invalid_count}</div>
                <div className="text-xs text-red-600 dark:text-red-400">Invalid — click for details</div>
              </button>
              {(validationReport.already_exists_count ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setDetailFilter(detailFilter === 'already_exists' ? 'all' : 'already_exists')}
                  className={`text-left rounded-lg p-3 border transition-all ${
                    detailFilter === 'already_exists'
                      ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/50'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400'
                  }`}
                >
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{validationReport.already_exists_count}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Already exist — click for details</div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailFilter('all')}
                className={`text-left rounded-lg p-3 border transition-all ${
                  detailFilter === 'all'
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-500 ring-2 ring-gray-500/50'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{validationReport.total_rows}</div>
                <div className="text-xs text-gray-500">Total rows — show all</div>
              </button>
            </div>

            {/* Summary message: X already exist, Y to import */}
            {(validationReport.already_exists_count ?? 0) > 0 && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {validationReport.already_exists_count} row{validationReport.already_exists_count !== 1 ? 's' : ''} already exist{validationReport.already_exists_count !== 1 ? '' : 's'} in the system.
                  {importableCount > 0 && (
                    <> {importableCount} row{importableCount !== 1 ? 's' : ''} {importableCount !== 1 ? 'are' : 'is'} ready to import.</>
                  )}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Existing rows will be skipped automatically. Only new rows will be imported.
                </p>
              </div>
            )}

            {/* Problems in this file – clear list of what's wrong */}
            {problemsList.length > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-4">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Problems in this file
                </p>
                <ul className="space-y-2 text-sm">
                  {problemsList.map(({ code, count, label, description }) => (
                    <li key={code} className="flex flex-col gap-0.5">
                      <span className="font-medium text-amber-800 dark:text-amber-200">
                        {label} — {count} row{count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300">{description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Check: Salespersons in this file – who exists vs not */}
            {validationReport.needs_attention_count > 0 && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Check: Salespersons in this file
                </p>
                {salespersonsNotInSystem.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Not in system ({salespersonsNotInSystem.length}): correct these or choose how to handle below.
                    </p>
                    <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-0.5">
                      {salespersonsNotInSystem.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  When a salesperson is not found in the system:
                </p>
                <Select value={salespersonOption} onValueChange={(v: 'skip' | 'name_only' | 'auto_create') => setSalespersonOption(v)}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_only">Import with name only (store name in “Attended by”)</SelectItem>
                    <SelectItem value="auto_create">Auto-create salesperson and assign</SelectItem>
                    <SelectItem value="skip">Skip those rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Error list – filtered by selected card */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b font-medium text-sm flex flex-wrap items-center justify-between gap-2">
                <span>
                  {detailFilter === 'all' && `Validation errors (${validationReport.errors.length})`}
                  {detailFilter === 'invalid' && `Invalid rows (${validationReport.invalid_count})`}
                  {detailFilter === 'already_exists' && `Already exist (${validationReport.already_exists_count ?? 0})`}
                  {detailFilter === 'needs_attention' && `Need attention (${validationReport.needs_attention_count})`}
                  {detailFilter === 'valid' && `Valid rows (${validationReport.valid_count})`}
                </span>
                {validationReport.errors.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={downloadValidationReport} className="text-xs">
                    <Download className="w-3 h-3 mr-1" /> Download report (CSV)
                  </Button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {detailFilter === 'valid' ? (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {validationReport.valid_count} row(s) passed validation. They can be imported when you click Import.
                    </p>
                    {validRowNumbers.length > 0 && (
                      <>
                        <p className="text-xs text-gray-500">Row numbers: {validRowNumbers.length <= 30 ? validRowNumbers.join(', ') : `${validRowNumbers.slice(0, 30).join(', ')}… and ${validRowNumbers.length - 30} more`}</p>
                        <Button variant="outline" size="sm" onClick={copyValidRowNumbers}>
                          Copy row numbers
                        </Button>
                      </>
                    )}
                  </div>
                ) : filteredValidationErrors.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No rows in this category.</p>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {paginatedErrors.map((e, i) => (
                          <tr key={i}>
                            <td className="px-2 py-2 font-mono text-xs">{e.row}</td>
                            <td className="px-2 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{e.code || '—'}</td>
                            <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">{e.field || '—'}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {canShowMore && (
                      <div className="px-3 py-2 border-t flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowAllErrors(true)}>
                          Show all ({filteredValidationErrors.length})
                        </Button>
                        {totalErrorPages > 1 && !showAllErrors && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            Page {errorListPage + 1} of {totalErrorPages}
                            <Button variant="ghost" size="sm" onClick={() => setErrorListPage((p) => Math.max(0, p - 1))} disabled={errorListPage === 0}>Prev</Button>
                            <Button variant="ghost" size="sm" onClick={() => setErrorListPage((p) => Math.min(totalErrorPages - 1, p + 1))} disabled={errorListPage >= totalErrorPages - 1}>Next</Button>
                          </span>
                        )}
                      </div>
                    )}
                    {showAllErrors && filteredValidationErrors.length > ERROR_LIST_PAGE_SIZE && (
                      <p className="text-xs text-gray-500 px-3 py-2 border-t">
                        Showing all {filteredValidationErrors.length} rows.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Import progress */}
            {step === 'importing' && importProgress && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      Importing customers…
                    </span>
                    {importProgress.total > 0 && (
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        Processing row {Math.min(importProgress.processed + 1, importProgress.total).toLocaleString()} of{' '}
                        {importProgress.total.toLocaleString()} rows
                      </span>
                    )}
                    {importProgress.row_num && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-200">
                        File row {importProgress.row_num}
                        {importProgress.name ? ` — ${importProgress.name}` : ''}
                      </span>
                    )}
                    {(importProgress.imported > 0 || importProgress.skipped > 0 || importProgress.failed > 0) && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-200">
                        Imported {importProgress.imported.toLocaleString()} · Skipped {importProgress.skipped.toLocaleString()} · Failed{' '}
                        {importProgress.failed.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {importStartTime && (
                  <div className="text-right">
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      Time elapsed: {formatDuration(importElapsedSeconds)}
                    </div>
                    {getImportEtaText() && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-200">
                        Estimated time left: {getImportEtaText()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Import result */}
            {importResult && step === 'report' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Import completed
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {importResult.imported} imported successfully.
                  {importResult.visits_added != null && importResult.visits_added > 0 && ` ${importResult.visits_added} additional visit(s) added for existing customers.`}
                  {importResult.skipped && importResult.skipped > 0 && ` ${importResult.skipped} skipped.`}
                  {importResult.failed > 0 && ` ${importResult.failed} failed.`}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Failed rows by row number:</p>
                    {groupedImportErrors.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto border rounded bg-white dark:bg-gray-900 mt-1">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Row</th>
                              <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Message(s)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {groupedImportErrors.map((g, i) => (
                              <tr key={i}>
                                <td className="px-2 py-1 font-mono">{g.row}</td>
                                <td className="px-2 py-1 text-green-600 dark:text-green-400">{g.messages.join('; ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ul className="text-xs text-green-600 dark:text-green-400 list-disc list-inside max-h-48 overflow-y-auto pr-2">
                        {importResult.errors.map((msg, i) => (
                          <li key={i} className="mb-0.5">{msg}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Global error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              {importResult ? (
                <>
                  <Button onClick={handleImportAnother}>
                    <Upload className="w-4 h-4 mr-2" /> Import another file
                  </Button>
                  <Button variant="outline" onClick={clearAndChooseNewFile}>
                    Choose new file
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  {importableCount > 0 && (
                    <Button onClick={handleImportClick} disabled={step === 'importing'}>
                      {step === 'importing' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" /> Import {importableCount} customer{importableCount !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleImportAnother} disabled={step === 'importing'}>
                    Choose another file
                  </Button>
                  <Button variant="outline" onClick={handleClose} disabled={step === 'importing'}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Report: import result only (e.g. after "Import failed rows only") */}
        {step === 'report' && importResult && !validationReport && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Import completed
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {importResult.imported} imported successfully.
                {importResult.failed > 0 && ` ${importResult.failed} failed.`}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Failed rows by row number:</p>
                  {groupedImportErrors.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto border rounded bg-white dark:bg-gray-900 mt-1">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Row</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">Message(s)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {groupedImportErrors.map((g, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1 font-mono">{g.row}</td>
                              <td className="px-2 py-1 text-green-600 dark:text-green-400">{g.messages.join('; ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <ul className="text-xs text-green-600 dark:text-green-400 list-disc list-inside max-h-48 overflow-y-auto pr-2">
                      {importResult.errors.map((msg, i) => (
                        <li key={i} className="mb-0.5">{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleImportAnother}>
                <Upload className="w-4 h-4 mr-2" /> Import another file
              </Button>
              <Button variant="outline" onClick={clearAndChooseNewFile}>
                Choose new file
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Confirm dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm import</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to import {importableCount.toLocaleString()} customer{importableCount !== 1 ? 's' : ''} into your database?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmImport} className="bg-primary text-primary-foreground">
                Import
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
