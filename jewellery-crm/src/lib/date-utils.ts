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



