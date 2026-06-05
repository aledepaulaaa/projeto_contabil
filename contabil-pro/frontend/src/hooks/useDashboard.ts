import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/DashboardService';
import type { DashboardMetrics } from '../services/DashboardService';

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['dashboardMetrics'],
    queryFn: DashboardService.getMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutos em cache
  });


  return {
    metrics: data,
    isLoading,
    error,
    refreshMetrics: refetch,
  };
}
