import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import SerproService, { type RendaContribuinteResponse } from '../services/SerproService';

export const useConsultaRenda = () => {
  const [dadosRenda, setDadosRenda] = useState<RendaContribuinteResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (token: string) => SerproService.consultarRenda(token),
    onSuccess: (data) => {
      setDadosRenda(data);
    },
  });

  const consultar = (token: string) => {
    mutation.mutate(token);
  };

  const reset = () => {
    setDadosRenda(null);
    mutation.reset();
  };

  // Captura o erro retornado pela API de forma amigável
  const getErrorMessage = () => {
    if (!mutation.error) return null;
    
    const errorObj = mutation.error as any;
    if (errorObj.response?.data?.erro) {
      return errorObj.response.data.erro;
    }
    return errorObj.message || 'Erro inesperado na consulta.';
  };

  return {
    dadosRenda,
    consultar,
    isLoading: mutation.isPending,
    error: getErrorMessage(),
    reset,
  };
};
