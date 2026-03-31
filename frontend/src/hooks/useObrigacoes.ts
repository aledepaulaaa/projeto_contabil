import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';

export interface Obrigacao {
  id: string;
  tipo: string;
  regime: string;
  valor: number;
  vencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  competencia: string;
}

export const useObrigacoes = () => {
  const { empresaLocatariaId } = useAuthStore();

  const { data: obrigacoes, isLoading, error, refetch } = useQuery({
    queryKey: ['obrigacoes', 'pendentes', empresaLocatariaId],
    queryFn: async () => {
      const response = await apiClient.get<Obrigacao[]>('/api/obrigacoes/pendentes');
      return response.data;
    },
    enabled: !!empresaLocatariaId,
    staleTime: 120000, // 2 minutos
  });

  return {
    obrigacoes,
    isLoading,
    error,
    refreshObrigacoes: refetch,
  };
};
