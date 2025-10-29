// Date utility functions for consistent date range handling

export const getCurrentMonthDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of current month
  const from = new Date(year, month, 1);

  // Last day of current month
  const to = new Date(year, month + 1, 0);

  return { from, to };
};

export const formatDateRange = (dateRange: { from: Date; to: Date } | undefined) => {
  if (!dateRange?.from || !dateRange?.to) {
    return 'All Time (No Filter)';
  }

  if (dateRange.from.getTime() === dateRange.to.getTime()) {
    return `Single Day: ${dateRange.from.toLocaleDateString('en-IN')}`;
  }

  return `Date Range: ${dateRange.from.toLocaleDateString('en-IN')} - ${dateRange.to.toLocaleDateString('en-IN')}`;
};

// Convert a local date to UTC start-of-day (00:00:00.000Z)
export const toUtcStartOfDay = (d: Date | undefined) => {
  if (!d) return undefined as unknown as string;
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
  return dt.toISOString();
};

// Convert a local date to UTC end-of-day (23:59:59.999Z)
export const toUtcEndOfDay = (d: Date | undefined) => {
  if (!d) return undefined as unknown as string;
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
  return dt.toISOString();
};

