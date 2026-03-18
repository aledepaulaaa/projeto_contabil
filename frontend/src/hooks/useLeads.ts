import { useQuery } from '@tanstack/react-query';
import { LeadService } from '../services/LeadService';

import { useAuthStore } from '../store/authStore';

export interface LeadResponse {
  id: string;
  nomeContato: string;
  email: string;
  nomeEmpresa: string;
  status: string;
}

/**
 * Custom Hook para gerenciar a listagem de Leads.
 * Utiliza TanStack Query para cache e estado de carregamento.
 */
export function useLeads() {
  const { tenantId } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery<LeadResponse[]>({
    queryKey: ['leads', tenantId],
    queryFn: async () => {
      console.log('Fetching leads for tenant:', tenantId);
      const response = await LeadService.listarLeads();
      console.log('Fetched leads:', response.length);
      return response;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    leads: data,
    isLoading,
    error,
    refreshLeads: refetch,
  };
}
