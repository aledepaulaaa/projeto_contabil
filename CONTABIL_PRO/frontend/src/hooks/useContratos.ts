import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContratoService from '../services/ContratoService';
import type { ContratoResponse } from '../services/ContratoService';

export type { ContratoResponse };

export function useContratos() {
  const queryClient = useQueryClient();

  const { data: contratos, isLoading, error } = useQuery({
    queryKey: ['contratos'],
    queryFn: ContratoService.listarContratos,
    staleTime: 30_000,
  });

  const ativarMutation = useMutation({
    mutationFn: (id: string) => ContratoService.ativarContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      ContratoService.cancelarContrato(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const retentarMutation = useMutation({
    mutationFn: (id: string) => ContratoService.retentarContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const arquivarMutation = useMutation({
    mutationFn: (id: string) => ContratoService.arquivarContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => ContratoService.excluirContrato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
    },
  });

  const ativarContrato = async (id: string) => {
    return ativarMutation.mutateAsync(id);
  };

  const cancelarContrato = async (id: string, motivo: string) => {
    return cancelarMutation.mutateAsync({ id, motivo });
  };

  const retentarContrato = async (id: string) => {
    return retentarMutation.mutateAsync(id);
  };

  const arquivarContrato = async (id: string) => {
    return arquivarMutation.mutateAsync(id);
  };

  const excluirContrato = async (id: string) => {
    return excluirMutation.mutateAsync(id);
  };

  const refreshContratos = () => {
    queryClient.invalidateQueries({ queryKey: ['contratos'] });
  };

  return {
    contratos: contratos || [],
    isLoading,
    error,
    ativarContrato,
    cancelarContrato,
    retentarContrato,
    arquivarContrato,
    excluirContrato,
    refreshContratos,
    isAtivando: ativarMutation.isPending,
    isCancelando: cancelarMutation.isPending,
    isRetentando: retentarMutation.isPending,
    isArquivando: arquivarMutation.isPending,
    isExcluindo: excluirMutation.isPending,
  };
}
