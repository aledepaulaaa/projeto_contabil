import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadService, type LeadData } from '../services/LeadService';
import { useAuthStore } from '../store/authStore';

export interface LeadResponse {
  id: string;
  nomeContato: string;
  email: string;
  nomeEmpresa: string | null;
  cnpj: string | null;
  telefone: string | null;
  status: string;
  origemLead: string | null;
  tipoServico: string | null;
  observacaoNaoFechamento: string | null;
  contratoId: string | null;
  contratoStatus: string | null;
  contratoUrl: string | null;
  criadoEm: string | null;
  quantidadeMensagensNaoLidas: number;
}

export function useLeads() {
  const { empresaLocatariaId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<LeadResponse[]>({
    queryKey: ['leads', empresaLocatariaId],
    queryFn: async () => {
      return await LeadService.listarLeads();
    },
    enabled: !!empresaLocatariaId,
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => LeadService.excluirLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: LeadData }) => LeadService.atualizarLead(id, dados),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['historico', id] });
      queryClient.invalidateQueries({ queryKey: ['historico', null] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status, observacao }: { id: string; status: string; observacao?: string }) => LeadService.moverLead(id, status, observacao),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['historico', id] });
      queryClient.invalidateQueries({ queryKey: ['historico', null] });
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    },
  });

  const generateContratoMutation = useMutation({
    mutationFn: (id: string) => LeadService.gerarContrato(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['historico', id] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: (id: string | null) => LeadService.limparHistorico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico'] });
    },
  });

  const archiveHistoryMutation = useMutation({
    mutationFn: ({ id, arquivar }: { id: string; arquivar: boolean }) => LeadService.arquivarHistorico(id, arquivar),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['historico', id] });
    },
  });

  return {
    leads: data,
    isLoading,
    error,
    refreshLeads: refetch,
    deleteLead: deleteMutation.mutateAsync,
    updateLead: updateMutation.mutateAsync,
    moveLead: moveMutation.mutateAsync,
    gerarContrato: generateContratoMutation.mutateAsync,
    clearHistory: clearHistoryMutation.mutateAsync,
    archiveHistory: archiveHistoryMutation.mutateAsync,
    exportCsv: LeadService.exportarCsv,
    exportPdf: LeadService.exportarPdf,
    exportarGeralCsv: LeadService.exportarHistoricoGeralCsv,
    exportarGeralPdf: LeadService.exportarHistoricoGeralPdf
  };
}
