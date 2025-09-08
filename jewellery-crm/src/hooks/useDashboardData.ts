import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';

// Query keys for consistent caching
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  salesDashboard: () => [...dashboardQueryKeys.all, 'sales'] as const,
  storeDashboard: () => [...dashboardQueryKeys.all, 'store'] as const,
  salesPipeline: () => [...dashboardQueryKeys.all, 'pipeline'] as const,
  appointments: () => [...dashboardQueryKeys.all, 'appointments'] as const,
  teamPerformance: () => [...dashboardQueryKeys.all, 'team'] as const,
  storeMetrics: () => [...dashboardQueryKeys.all, 'store-metrics'] as const,
};

// Sales Dashboard Hook
export function useSalesDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.salesDashboard(),
    queryFn: async () => {
      const response = await apiService.getSalesDashboard();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sales dashboard data');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for sales data
  });
}

// Store Dashboard Hook
export function useStoreDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.storeDashboard(),
    queryFn: async () => {
      const response = await apiService.getBusinessAdminDashboard();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch store dashboard data');
      }
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes for store data
  });
}

// Sales Pipeline Hook
export function useSalesPipeline() {
  return useQuery({
    queryKey: dashboardQueryKeys.salesPipeline(),
    queryFn: async () => {
      const response = await apiService.getSalesPipeline();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sales pipeline data');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute for pipeline data
  });
}

// Appointments Hook
export function useAppointments() {
  return useQuery({
    queryKey: dashboardQueryKeys.appointments(),
    queryFn: async () => {
      const response = await apiService.getAppointments();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch appointments data');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute for appointments
  });
}

// Team Performance Hook
export function useTeamPerformance() {
  return useQuery({
    queryKey: dashboardQueryKeys.teamPerformance(),
    queryFn: async () => {
      const response = await apiService.getStorePerformance('team');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch team performance data');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for team data
  });
}

// Store Metrics Hook
export function useStoreMetrics() {
  return useQuery({
    queryKey: dashboardQueryKeys.storeMetrics(),
    queryFn: async () => {
      const response = await apiService.getStorePerformance('current');
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch store metrics data');
      }
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes for store metrics
  });
}
