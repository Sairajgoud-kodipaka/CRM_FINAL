'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { DateRange } from '@/components/ui/shopify-date-picker';
import { globalDateParameterService } from '@/lib/global-date-parameters';

interface GlobalDateRangeContextType {
  dateRange: DateRange;
  appliedDateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshData: () => void;
  clearDateRange: () => void;
  applyDateRange: () => void;
  hasChanges: boolean;
}

const GlobalDateRangeContext = createContext<GlobalDateRangeContextType | undefined>(undefined);

interface GlobalDateRangeProviderProps {
  children: ReactNode;
  defaultRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  autoApply?: boolean;
}

export const GlobalDateRangeProvider: React.FC<GlobalDateRangeProviderProps> = ({
  children,
  defaultRange,
  onDateRangeChange,
  autoApply = false
}) => {
  // Get current month's start and end dates as default
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
  };

  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    if (defaultRange) return defaultRange;

    // Default to current month
    return getCurrentMonthRange();
  });

  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(dateRange);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  // Check if there are unsaved changes
  useEffect(() => {
    const hasUnsavedChanges =
      dateRange.start?.getTime() !== appliedDateRange.start?.getTime() ||
      dateRange.end?.getTime() !== appliedDateRange.end?.getTime();
    setHasChanges(hasUnsavedChanges);
  }, [dateRange, appliedDateRange]);

  // Monthly refresh logic - check if month has changed
  useEffect(() => {
    const checkMonthChange = () => {
      const now = new Date();
      const currentMonthIndex = now.getMonth();

      if (currentMonthIndex !== currentMonth) {

        setCurrentMonth(currentMonthIndex);

        // Auto-refresh to new month if no custom range is selected
        const newMonthRange = getCurrentMonthRange();
        setDateRangeState(newMonthRange);
        setAppliedDateRange(newMonthRange);
        setHasChanges(false);

        // Trigger callback if provided
        if (onDateRangeChange) {
          onDateRangeChange(newMonthRange);
        }
      }
    };

    // Check every minute for month change
    const interval = setInterval(checkMonthChange, 60000);

    // Also check immediately
    checkMonthChange();

    return () => clearInterval(interval);
  }, [currentMonth, onDateRangeChange]);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);

    if (autoApply) {
      applyDateRange(range);
    }
  }, [autoApply]);

  const applyDateRange = useCallback((range?: DateRange) => {
    const rangeToApply = range || dateRange;

    setIsLoading(true);
    setAppliedDateRange(rangeToApply);
    setLastUpdated(new Date());
    setHasChanges(false);

    // Notify global date parameter service
    globalDateParameterService.setDateRange(rangeToApply);

    // Call the callback if provided
    if (onDateRangeChange) {
      onDateRangeChange(rangeToApply);
    }

    // Simulate loading time for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [dateRange, onDateRangeChange]);

  const clearDateRange = useCallback(() => {
    const today = new Date();
    const clearedRange = { start: today, end: today };
    setDateRangeState(clearedRange);
    setAppliedDateRange(clearedRange);
    setHasChanges(false);
    setLastUpdated(new Date());

    // Notify global date parameter service
    globalDateParameterService.setDateRange(clearedRange);

    if (onDateRangeChange) {
      onDateRangeChange(clearedRange);
    }
  }, [onDateRangeChange]);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setLastUpdated(new Date());

    if (onDateRangeChange) {
      onDateRangeChange(appliedDateRange);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [appliedDateRange, onDateRangeChange]);

  const contextValue: GlobalDateRangeContextType = {
    dateRange,
    appliedDateRange,
    setDateRange,
    isLoading,
    lastUpdated,
    refreshData,
    clearDateRange,
    applyDateRange: () => applyDateRange(),
    hasChanges
  };

  return (
    <GlobalDateRangeContext.Provider value={contextValue}>
      {children}
    </GlobalDateRangeContext.Provider>
  );
};

export const useGlobalDateRange = (): GlobalDateRangeContextType => {
  const context = useContext(GlobalDateRangeContext);
  if (context === undefined) {
    throw new Error('useGlobalDateRange must be used within a GlobalDateRangeProvider');
  }
  return context;
};

// Hook for components that need to react to date range changes
export const useDateRangeEffect = (
  callback: (range: DateRange) => void | Promise<void>,
  deps: React.DependencyList = []
) => {
  const { appliedDateRange } = useGlobalDateRange();

  useEffect(() => {
    callback(appliedDateRange);
  }, [appliedDateRange, ...deps]);
};

// Hook for getting formatted date range strings
export const useFormattedDateRange = () => {
  const { appliedDateRange } = useGlobalDateRange();

  const formatDateRange = useCallback((range: DateRange): string => {
    if (!range.start) return 'No date selected';

    if (!range.end || range.start.getTime() === range.end.getTime()) {
      return range.start.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    return `${range.start.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })} - ${range.end.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`;
  }, []);

  const getDateRangeForAPI = useCallback((range: DateRange) => {
    if (!range.start) return null;

    const startDate = new Date(range.start);
    const endDate = range.end ? new Date(range.end) : new Date(range.start);

    // Set time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      filter_type: 'custom'
    };
  }, []);

  const getRelativeTimeString = useCallback((date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return {
    formattedRange: formatDateRange(appliedDateRange),
    apiParams: getDateRangeForAPI(appliedDateRange),
    getRelativeTimeString,
    appliedDateRange
  };
};

export default useGlobalDateRange;
