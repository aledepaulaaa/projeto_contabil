import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OnboardingService, type OnboardingData, type TarefaOnboarding } from '../services/OnboardingService';
import { useAuthStore } from '../store/authStore';

export function useOnboarding() {
  const { empresaLocatariaId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<OnboardingData[]>({
    queryKey: ['onboarding', empresaLocatariaId],
    queryFn: OnboardingService.listar,
    enabled: !!empresaLocatariaId,
    staleTime: 1000 * 60 * 5,
  });

  const updateResumoMutation = useMutation({
    mutationFn: ({ id, resumo }: { id: string; resumo: string }) => 
      OnboardingService.atualizarResumo(id, resumo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const addTarefaMutation = useMutation({
    mutationFn: ({ id, tarefa }: { id: string; tarefa: Partial<TarefaOnboarding> }) => 
      OnboardingService.adicionarTarefa(id, tarefa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const updateTarefaMutation = useMutation({
    mutationFn: ({ tarefaId, tarefa }: { tarefaId: string; tarefa: Partial<TarefaOnboarding> }) => 
      OnboardingService.editarTarefa(tarefaId, tarefa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const moveTarefaMutation = useMutation({
    mutationFn: ({ tarefaId, status }: { tarefaId: string; status: string }) => 
      OnboardingService.atualizarStatusTarefa(tarefaId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const deleteTarefaMutation = useMutation({
    mutationFn: (tarefaId: string) => OnboardingService.excluirTarefa(tarefaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  return {
    onboarding: data,
    isLoading,
    error,
    refresh: refetch,
    atualizarResumo: updateResumoMutation.mutateAsync,
    adicionarTarefa: addTarefaMutation.mutateAsync,
    editarTarefa: updateTarefaMutation.mutateAsync,
    moverTarefa: moveTarefaMutation.mutateAsync,
    excluirTarefa: deleteTarefaMutation.mutateAsync,
  };
}
