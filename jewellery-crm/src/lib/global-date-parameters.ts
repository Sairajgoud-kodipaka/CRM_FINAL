// Global Date Parameter Service
// This service automatically adds date filter parameters to all API requests

interface DateRange {
  start: Date | null;
  end: Date | null;
}

class GlobalDateParameterService {
  private currentDateRange: DateRange | null = null;
  private listeners: Array<(dateRange: DateRange | null) => void> = [];

  setDateRange(dateRange: DateRange | null) {
    this.currentDateRange = dateRange;
    this.notifyListeners();
  }

  getDateRange(): DateRange | null {
    return this.currentDateRange;
  }

  getDateParameters(): Record<string, string> {
    if (!this.currentDateRange?.start) {
      return {};
    }

    const startDate = this.currentDateRange.start;
    const endDate = this.currentDateRange.end || this.currentDateRange.start;

    return {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      filter_type: 'custom'
    };
  }

  addListener(callback: (dateRange: DateRange | null) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (dateRange: DateRange | null) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentDateRange));
  }
}

export const globalDateParameterService = new GlobalDateParameterService();


