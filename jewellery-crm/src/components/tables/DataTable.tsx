/**
 * Reusable Data Table Component
 *
 * HubSpot-inspired data table with sorting, filtering, and pagination.
 * Designed to be flexible and reusable across different data types.
 *
 * Key Features:
 * - Sortable columns
 * - Row selection with checkboxes
 * - Custom cell renderers
 * - Responsive design
 * - Loading and empty states
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  priority?: 'high' | 'medium' | 'low'; // For responsive display
  mobileLabel?: string; // Custom label for mobile cards
  render?: (value: unknown, row: T) => React.ReactNode;
  mobileRender?: (value: unknown, row: T) => React.ReactNode; // Custom mobile rendering
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  onAction?: (action: string, row: T) => void;
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  // Mobile-specific props
  mobileCardTitle?: (row: T) => string;
  mobileCardSubtitle?: (row: T) => string;
  mobileCardActions?: (row: T) => React.ReactNode;
}

// Mobile Card View Component
function MobileCardView<T extends Record<string, unknown>>({
  data,
  columns,
  loading,
  selectable,
  onRowSelect,
  onRowClick,
  onAction,
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardActions,
  selectedRows,
  onRowSelectChange,
}: {
  data: T[];
  columns: Column<T>[];
  loading: boolean;
  selectable: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  onAction?: (action: string, row: T) => void;
  mobileCardTitle?: (row: T) => string;
  mobileCardSubtitle?: (row: T) => string;
  mobileCardActions?: (row: T) => React.ReactNode;
  selectedRows: Set<number>;
  onRowSelectChange: (index: number, checked: boolean) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">No items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {data.map((row, index) => {
        const isSelected = selectedRows.has(index);
        const title = mobileCardTitle ? mobileCardTitle(row) : String(row[columns[0]?.key] || 'Untitled');
        const subtitle = mobileCardSubtitle ? mobileCardSubtitle(row) : String(row[columns[1]?.key] || '');

        return (
          <Card
            key={index}
            className={cn(
              'transition-all duration-200 hover:shadow-md cursor-pointer',
              isSelected && 'ring-2 ring-primary bg-primary/5',
              'touch-manipulation' // Optimize for touch
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Selection checkbox */}
                  {selectable && (
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onRowSelectChange(index, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </div>
                  )}

                  {/* Title and subtitle */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground text-base leading-tight mb-1">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground leading-tight">
                        {subtitle}
                      </p>
                    )}
                  </div>

                  {/* Key data fields */}
                  <div className="space-y-2">
                    {columns
                      .filter(col => col.priority === 'high' || col.priority === 'medium')
                      .slice(0, 3) // Show max 3 key fields on mobile
                      .map((column) => {
                        const value = row[column.key];
                        const displayValue = column.mobileRender
                          ? column.mobileRender(value, row)
                          : column.render
                            ? column.render(value, row)
                            : value;

                        if (!displayValue) return null;

                        return (
                          <div key={column.key} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium min-w-0 flex-shrink-0">
                              {column.mobileLabel || column.title}:
                            </span>
                            <span className="text-foreground truncate">
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  {mobileCardActions ? (
                    mobileCardActions(row)
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 touch-manipulation"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onAction?.('view', row)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction?.('edit', row)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAction?.('delete', row)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * DataTable Component
 *
 * Generic, reusable data table following HubSpot design patterns.
 * Now includes responsive behavior for mobile and tablet devices.
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchable = true,
  selectable = false,
  onRowSelect,
  onRowClick,
  onAction,
  actions,
  emptyState,
  className,
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Responsive breakpoints
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sort data based on sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] as any;
      const bValue = b[sortConfig.key] as any;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  /**
   * Handle column sorting
   */
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === columnKey) {
        return {
          key: columnKey,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  /**
   * Handle row selection
   */
  const handleRowSelect = (index: number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(index);
    } else {
      newSelection.delete(index);
    }
    setSelectedRows(newSelection);

    if (onRowSelect) {
      const selectedData = Array.from(newSelection).map(i => sortedData[i]);
      onRowSelect(selectedData);
    }
  };

  /**
   * Handle select all
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(sortedData.map((_, index) => index));
      setSelectedRows(allIndices);
      onRowSelect?.(sortedData);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  /**
   * Get sort icon for column
   */
  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  /**
   * Render cell content
   */
  const renderCell = (column: Column<T>, row: T) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key] as React.ReactNode;
  };

  if (loading) {
    return (
      <div className={cn('bg-card border border-border rounded-lg', className)}>
        {/* Header skeleton */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="h-10 w-64 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Render mobile card view for mobile devices
  if (isMobile) {
    return (
      <div className={cn('w-full', className)}>
        {/* Header with search and actions */}
        {(searchable || actions || selectedRows.size > 0) && (
          <div className="mb-4 p-4 bg-card border border-border rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Search */}
              {searchable && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRows.size > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {selectedRows.size} selected
                  </Badge>
                )}

                {actions}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <MobileCardView
          data={sortedData}
          columns={columns}
          loading={loading}
          selectable={selectable}
          onRowSelect={onRowSelect}
          onRowClick={onRowClick}
          onAction={onAction}
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          mobileCardActions={mobileCardActions}
          selectedRows={selectedRows}
          onRowSelectChange={handleRowSelect}
        />
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg overflow-hidden', className)}>
      {/* Table Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {selectedRows.size > 0 && (
              <Badge variant="secondary">
                {selectedRows.size} selected
              </Badge>
            )}

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {actions}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-12 px-6 py-3">
                  <Checkbox
                    checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:text-foreground group',
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}

              <th className="w-12 px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="bg-card divide-y divide-border">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 2 : 1)} className="px-6 py-12">
                  {emptyState || (
                    <div className="text-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    selectedRows.has(index) && 'bg-primary/5'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedRows.has(index)}
                        onCheckedChange={(checked) => handleRowSelect(index, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-foreground"
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}

                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedData.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {sortedData.length} of {data.length} results
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
