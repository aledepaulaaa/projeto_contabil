import { apiClient } from './apiClient';

export interface DashboardMetrics {
  totalLeads: number;
  obrigacoesPendentes: number;
  alvarasVencidos: number;
  faturamentoPrevisto: number;
  ltv?: number;
  cac?: number;
  churnRate?: number;
  contratosAtivos?: number;
  contratosCancelados?: number;
  contratosAguardando?: number;
  variacaoReceitaPercentual?: number;
  motivosChurn?: Record<string, number>;
}

export const DashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const { data } = await apiClient.get<DashboardMetrics>('/api/dashboard/metrics');
      return data;
    } catch {
      return {
        totalLeads: 0,
        obrigacoesPendentes: 0,
        alvarasVencidos: 0,
        faturamentoPrevisto: 0,
        ltv: 0,
        cac: 0,
        churnRate: 0,
        contratosAtivos: 0,
        contratosCancelados: 0,
        contratosAguardando: 0,
        variacaoReceitaPercentual: 0,
        motivosChurn: {}
      };
    }
  },
};
