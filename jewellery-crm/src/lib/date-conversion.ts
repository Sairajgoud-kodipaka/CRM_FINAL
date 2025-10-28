import { CalendarDate } from '@internationalized/date';
import { DateRange } from 'react-day-picker';

/**
 * Convert HeroUI CalendarDate range to react-day-picker DateRange
 */
export function heroUIToDateRange(heroUIValue: { start: CalendarDate | null; end: CalendarDate | null }): DateRange | undefined {
  if (!heroUIValue.start) return undefined;

  const startDate = new Date(heroUIValue.start.toString());
  const endDate = heroUIValue.end ? new Date(heroUIValue.end.toString()) : undefined;

  return {
    from: startDate,
    to: endDate
  };
}

/**
 * Convert react-day-picker DateRange to HeroUI CalendarDate range
 */
export function dateRangeToHeroUI(dateRange: DateRange | undefined): { start: CalendarDate | null; end: CalendarDate | null } {
  if (!dateRange?.from) return { start: null, end: null };

  const startDate = CalendarDate.fromAbsolute(dateRange.from.getTime(), 'UTC');
  const endDate = dateRange.to ? CalendarDate.fromAbsolute(dateRange.to.getTime(), 'UTC') : null;

  return {
    start: startDate,
    end: endDate
  };
}
