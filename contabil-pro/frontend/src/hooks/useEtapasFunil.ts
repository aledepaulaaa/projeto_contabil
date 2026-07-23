import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface EtapaFunil {
  id?: string;
  empresaLocatariaId?: string;
  chave: string;
  nome: string;
  ordem: number;
  cor?: string;
}

const DEFAULT_ETAPAS: EtapaFunil[] = [
  { chave: 'LEAD', nome: 'Lead', ordem: 1, cor: '#3b82f6' },
  { chave: 'QUALIFICACAO', nome: 'Qualificação', ordem: 2, cor: '#6366f1' },
  { chave: 'PROPOSTA', nome: 'Proposta', ordem: 3, cor: '#8b5cf6' },
  { chave: 'AGUARDANDO_APROVACAO', nome: 'Aguardando Aprovação', ordem: 4, cor: '#f59e0b' },
  { chave: 'FECHAMENTO', nome: 'Fechamento', ordem: 5, cor: '#10b981' },
  { chave: 'NAO_FECHOU', nome: 'Não Fechou', ordem: 6, cor: '#ef4444' },
];

export function useEtapasFunil() {
  const queryClient = useQueryClient();

  const { data: etapas = DEFAULT_ETAPAS, isLoading, error } = useQuery<EtapaFunil[]>({
    queryKey: ['etapasFunil'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<EtapaFunil[]>('/api/crm/etapas');
        if (data && data.length > 0) return data;
        return DEFAULT_ETAPAS;
      } catch {
        return DEFAULT_ETAPAS;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const salvarEtapaMutation = useMutation({
    mutationFn: async (etapa: EtapaFunil) => {
      const { data } = await apiClient.post<EtapaFunil>('/api/crm/etapas', etapa);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapasFunil'] });
    },
  });

  const removerEtapaMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/crm/etapas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etapasFunil'] });
    },
  });

  return {
    etapas,
    isLoading,
    error,
    salvarEtapa: salvarEtapaMutation.mutateAsync,
    removerEtapa: removerEtapaMutation.mutateAsync,
    isSalvando: salvarEtapaMutation.isPending,
  };
}
