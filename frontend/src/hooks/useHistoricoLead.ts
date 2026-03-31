import { useQuery } from '@tanstack/react-query';
import { LeadService } from '../services/LeadService';
import type { HistoricoLeadResponse } from '../services/LeadService';

/**
 * Hook para buscar e gerenciar o histórico de vida de um Lead.
 * Alimenta a Timeline Lateral com eventos ordenados cronologicamente.
 */
export function useHistoricoLead(leadId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<HistoricoLeadResponse>({
    queryKey: ['historico', leadId],
    queryFn: async () => {
        if (leadId) return LeadService.buscarHistorico(leadId);
        
        // Se não houver leadId, busca o histórico global e envelopa no formato esperado
        const eventos = await LeadService.buscarHistoricoGlobal();
        return {
            leadId: 'GERAL',
            arquivado: false,
            eventos
        };
    },
    staleTime: 1000 * 30, // 30 segundos — Timeline precisa ser mais "fresca"
  });

  return {
    historico: data,
    eventos: data?.eventos ?? [],
    arquivado: data?.arquivado ?? false,
    isLoading,
    error,
    refreshHistorico: refetch,
  };
}
