'use client';

import React from 'react';
import { RangeCalendar } from '@heroui/react';
import { today, getLocalTimeZone, parseDate } from '@internationalized/date';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DateRange = {
  from: Date;
  to: Date;
};

interface HeroUIRangeCalendarProps {
  dateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function HeroUIRangeCalendar({
  dateRange,
  onDateRangeChange,
  placeholder = "Select date range",
  className
}: HeroUIRangeCalendarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Convert Date to CalendarDate for HeroUI
  const convertToCalendarDate = (date: Date) => {
    return parseDate(date.toISOString().split('T')[0]);
  };

  // Convert CalendarDate to Date
  const convertToDate = (calendarDate: any) => {
    return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
  };

  // HeroUI controlled value - always use the current dateRange
  const getCurrentValue = () => {
    if (dateRange?.from && dateRange?.to) {
      const start = convertToCalendarDate(dateRange.from);
      const end = convertToCalendarDate(dateRange.to);

      return { start, end };
    }

    return null;
  };

  const handleValueChange = (newValue: any) => {


    // Apply immediately when both dates are selected
    if (newValue.start && newValue.end) {
      const from = convertToDate(newValue.start);
      const to = convertToDate(newValue.end);

      onDateRangeChange?.({ from, to });
      setIsOpen(false);
    }
  };

  const handleClear = () => {

    onDateRangeChange?.(undefined);
    setIsOpen(false);
  };

  const formatDisplayDate = () => {
    if (!dateRange) return placeholder;

    const start = dateRange.from.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const end = dateRange.to.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    if (start === end) return start;
    return `${start} - ${end}`;
  };

  const currentValue = getCurrentValue();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">
            {formatDisplayDate()}
          </span>
          {dateRange && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Select Date Range</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Debug info - remove in production */}
          {currentValue && (
            <div className="mb-2 p-2 bg-gray-100 rounded text-xs">
              <div>Selected: {currentValue.start?.day}/{currentValue.start?.month}/{currentValue.start?.year} - {currentValue.end?.day}/{currentValue.end?.month}/{currentValue.end?.year}</div>
              <div>Should show: Month {currentValue.start?.month}, Year {currentValue.start?.year}</div>
            </div>
          )}

          <RangeCalendar
            key={`${currentValue?.start?.year}-${currentValue?.start?.month}-${currentValue?.start?.day}-${currentValue?.end?.year}-${currentValue?.end?.month}-${currentValue?.end?.day}`}
            aria-label="Date Range Picker"
            value={currentValue}
            onChange={handleValueChange}
            // Always show the month containing the selected date
            defaultFocusedValue={currentValue?.start || today(getLocalTimeZone())}
            // Show month/year pickers for easy navigation
            showMonthAndYearPickers={true}
            // Disable non-contiguous ranges
            allowsNonContiguousRanges={false}
            // Always show 2 months to ensure cross-month ranges are visible
            visibleMonths={2}
            // Force the calendar to show the month containing the start date
            focusedValue={currentValue?.start || today(getLocalTimeZone())}
            // Add custom styling to ensure highlighting works
            className="w-full"
            classNames={{
              base: "w-full",
              content: "w-full",
              table: "w-full",
              cell: "w-full",
              day: "w-full",
              day_selected: "bg-blue-600 text-white font-bold",
              day_range_start: "bg-blue-600 text-white font-bold",
              day_range_end: "bg-blue-600 text-white font-bold",
              day_range_middle: "bg-blue-200 text-blue-900 font-medium",
            }}
          />

          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              onClick={handleClear}
              variant="outline"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
