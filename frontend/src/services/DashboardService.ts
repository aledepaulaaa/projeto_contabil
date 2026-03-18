import { apiClient } from './apiClient';

export interface DashboardMetrics {
  totalLeads: number;
  obrigacoesPendentes: number;
  alvarasVencidos: number;
  faturamentoPrevisto: number;
}

export const DashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const { data } = await apiClient.get<DashboardMetrics>('/api/dashboard/metrics');
    return data;
  },
};
