'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DatePickerProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
  month?: number;
  year?: number;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showPresets?: boolean;
  minDate?: Date;
  maxDate?: Date;
  allowSingleDate?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESETS = [
  { label: 'Today', getValue: () => {
    const today = new Date();
    return { start: today, end: today };
  }},
  { label: 'Yesterday', getValue: () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return { start: yesterday, end: yesterday };
  }},
  { label: 'This Week', getValue: () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return { start: startOfWeek, end: today };
  }},
  { label: 'Last Week', getValue: () => {
    const today = new Date();
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    return { start: lastWeekStart, end: lastWeekEnd };
  }},
  { label: 'This Month', getValue: () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: startOfMonth, end: today };
  }},
  { label: 'Last Month', getValue: () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: lastMonth, end: lastMonthEnd };
  }},
  { label: 'Last 7 Days', getValue: () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    return { start: sevenDaysAgo, end: today };
  }},
  { label: 'Last 30 Days', getValue: () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return { start: thirtyDaysAgo, end: today };
  }}
];

export const ShopifyDatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  onMonthChange,
  onYearChange,
  disabled = false,
  placeholder = "Select date range",
  className,
  showPresets = true,
  minDate,
  maxDate,
  allowSingleDate = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentMonth2, setCurrentMonth2] = useState(month + 1);
  const [currentYear2, setCurrentYear2] = useState(year);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateRange = (range: DateRange): string => {
    if (!range.start) return placeholder;

    if (!range.end || (range.start.getTime() === range.end.getTime())) {
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
  };

  const getDaysInMonth = (month: number, year: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(firstDay.getDate() - i - 1);
      days.push(prevDate);
    }

    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selected.start) return false;
    if (!selected.end) return date.getTime() === selected.start.getTime();

    const startTime = selected.start.getTime();
    const endTime = selected.end.getTime();
    const dateTime = date.getTime();

    return dateTime >= startTime && dateTime <= endTime;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selected.start) return false;
    if (!selected.end) return date.getTime() === selected.start.getTime();

    return date.getTime() === selected.start.getTime() ||
           date.getTime() === selected.end.getTime();
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (date > today) return true; // Disable future dates

    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!selected.start || (selected.start && selected.end)) {
      // Start new selection
      onChange({ start: date, end: null });
    } else if (selected.start && !selected.end) {
      // Complete selection
      if (date < selected.start) {
        onChange({ start: date, end: selected.start });
      } else {
        onChange({ start: selected.start, end: date });
      }
      setIsOpen(false);
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onChange({ start: null, end: null });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
        setCurrentMonth2(0);
        setCurrentYear2(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
        setCurrentMonth2(currentMonth);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
        setCurrentMonth2(1);
        setCurrentYear2(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
        setCurrentMonth2(currentMonth + 2);
      }
    }
  };

  const days1 = getDaysInMonth(currentMonth, currentYear);
  const days2 = getDaysInMonth(currentMonth2, currentYear2);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <div className="relative w-full">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected.start && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange(selected)}
        </Button>
        {selected.start && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0 hover:bg-transparent rounded-sm flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-96 rounded-lg border bg-background p-4 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {MONTHS[currentMonth]} {currentYear}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium">
                {MONTHS[currentMonth2]} {currentYear2}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Presets */}
          {showPresets && (
            <div className="mb-4 border-b pb-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Quick Select</div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="px-2 py-1 text-xs text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Month */}
            <div>
              <div className="mb-2 text-center text-sm font-medium">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {days1.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isSelected = isDateSelected(date);
                  const isInRange = isDateInRange(date);
                  const isDisabled = isDateDisabled(date);
                  const isHovered = hoveredDate && date.getTime() === hoveredDate.getTime();

                  return (
                    <button
                      key={index}
                      className={cn(
                        "h-8 w-8 rounded text-xs transition-colors",
                        !isCurrentMonth && "text-muted-foreground",
                        isSelected && "bg-primary text-primary-foreground",
                        isInRange && !isSelected && "bg-primary/20",
                        isDisabled && "cursor-not-allowed opacity-50",
                        !isDisabled && "hover:bg-accent",
                        isHovered && "bg-accent"
                      )}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={isDisabled}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Second Month */}
            <div>
              <div className="mb-2 text-center text-sm font-medium">
                {MONTHS[currentMonth2]} {currentYear2}
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {days2.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth2;
                  const isSelected = isDateSelected(date);
                  const isInRange = isDateInRange(date);
                  const isDisabled = isDateDisabled(date);
                  const isHovered = hoveredDate && date.getTime() === hoveredDate.getTime();

                  return (
                    <button
                      key={index}
                      className={cn(
                        "h-8 w-8 rounded text-xs transition-colors",
                        !isCurrentMonth && "text-muted-foreground",
                        isSelected && "bg-primary text-primary-foreground",
                        isInRange && !isSelected && "bg-primary/20",
                        isDisabled && "cursor-not-allowed opacity-50",
                        !isDisabled && "hover:bg-accent",
                        isHovered && "bg-accent"
                      )}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={isDisabled}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Data as of {new Date().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata'
              })} IST</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyDatePicker;
