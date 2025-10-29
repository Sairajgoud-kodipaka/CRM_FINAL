'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ShopifyDatePicker } from '@/components/ui/shopify-date-picker';
import { useGlobalDateRange, useFormattedDateRange } from '@/hooks/useGlobalDateRange';
import {
  Calendar,
  RefreshCw,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
  Download,
  Settings,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalDateFilterProps {
  className?: string;
  showExportButton?: boolean;
  showSettingsButton?: boolean;
  onExport?: () => void;
  onSettings?: () => void;
  compact?: boolean;
  sticky?: boolean;
}

export const GlobalDateFilter: React.FC<GlobalDateFilterProps> = ({
  className,
  showExportButton = true,
  showSettingsButton = false,
  onExport,
  onSettings,
  compact = false,
  sticky = true
}) => {
  const {
    dateRange,
    setDateRange,
    isLoading,
    lastUpdated,
    refreshData,
    applyDateRange,
    hasChanges
  } = useGlobalDateRange();

  const { formattedRange, getRelativeTimeString } = useFormattedDateRange();

  const handleApply = () => {
    applyDateRange();
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({ start: startOfMonth, end: endOfMonth });
    applyDateRange();
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
        </div>
      );
    }

    if (hasChanges) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unsaved changes
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />
        Applied
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center space-x-3",
        sticky && "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
        className
      )}>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Date Range:</span>
        </div>

        <div className="flex-1 max-w-xs">
          <ShopifyDatePicker
            selected={dateRange}
            onChange={setDateRange}
            className="w-full"
            showPresets={false}
          />
        </div>

        {hasChanges && (
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={cn("w-4 h-4")} />
        </Button>

        {getStatusBadge()}
      </div>
    );
  }

  return (
    <Card className={cn(
      "w-full",
      sticky && "sticky top-0 z-40",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Date Picker */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Global Date Filter</span>
            </div>

            <div className="w-80">
              <ShopifyDatePicker
                selected={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>

            {hasChanges && (
              <Button onClick={handleApply} disabled={isLoading}>
                Apply Filter
              </Button>
            )}
          </div>

          {/* Right Section - Status & Actions */}
          <div className="flex items-center space-x-3">
            {/* Status Information */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated ? getRelativeTimeString(lastUpdated) : 'Never'}</span>
            </div>

            {/* Status Badge */}
            {getStatusBadge()}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToCurrentMonth}
                disabled={isLoading}
                title="Reset to current month"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Current Month
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2")} />
                Refresh
              </Button>

              {showExportButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}

              {showSettingsButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSettings}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="mt-3 pt-3 border-t border-muted">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                <strong>Selected Range:</strong> {formattedRange}
              </span>
              <span>
                <strong>Filter Type:</strong> Custom Date Range
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs">
                All dashboard sections will update with this date range
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version for smaller spaces
export const CompactDateFilter: React.FC<Omit<GlobalDateFilterProps, 'compact'>> = (props) => {
  return <GlobalDateFilter {...props} compact={true} />;
};

// Sticky version for dashboard headers
export const StickyDateFilter: React.FC<Omit<GlobalDateFilterProps, 'sticky'>> = (props) => {
  return <GlobalDateFilter {...props} sticky={true} />;
};

export default GlobalDateFilter;
