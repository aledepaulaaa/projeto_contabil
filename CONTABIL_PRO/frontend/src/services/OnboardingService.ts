import { apiClient } from "./apiClient";

export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface ItemChecklist {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface TarefaOnboarding {
  id: string;
  onboardingId: string;
  titulo: string;
  descricao: string;
  status: 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  prioridade: PrioridadeTarefa;
  checklist: ItemChecklist[];
  dataInicio: string | null;
  dataFim: string | null;
}

export interface OnboardingData {
  id: string;
  leadId: string;
  empresaLocatariaId: string;
  resumoIA: string;
  status: 'AGUARDANDO_PARAMETRIZACAO' | 'EM_ADOCAO' | 'IMPLANTADO';
  tarefas: TarefaOnboarding[];
  criadoEm: string;
}

export const OnboardingService = {
  listar: async (): Promise<OnboardingData[]> => {
    const response = await apiClient.get('/api/onboarding');
    return response.data;
  },

  buscarPorId: async (id: string): Promise<OnboardingData> => {
    const response = await apiClient.get(`/api/onboarding/${id}`);
    return response.data;
  },

  atualizarResumo: async (id: string, resumo: string): Promise<OnboardingData> => {
    const response = await apiClient.patch(`/api/onboarding/${id}/resumo`, { resumo });
    return response.data;
  },

  adicionarTarefa: async (id: string, tarefa: Partial<TarefaOnboarding>): Promise<OnboardingData> => {
    const response = await apiClient.post(`/api/onboarding/${id}/tarefas`, tarefa);
    return response.data;
  },

  editarTarefa: async (tarefaId: string, tarefa: Partial<TarefaOnboarding>): Promise<void> => {
    await apiClient.patch(`/api/onboarding/tarefas/${tarefaId}`, tarefa);
  },

  atualizarStatusTarefa: async (tarefaId: string, status: string): Promise<void> => {
    await apiClient.patch(`/api/onboarding/tarefas/${tarefaId}/status`, null, {
      params: { status }
    });
  },

  excluirTarefa: async (tarefaId: string): Promise<void> => {
    await apiClient.delete(`/api/onboarding/tarefas/${tarefaId}`);
  }
};
