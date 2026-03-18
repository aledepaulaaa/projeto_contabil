import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const useSeguranca = () => {
  const recuperarSenhaMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post('/auth/recuperar-senha', { email });
    },
  });

  const resetarSenhaMutation = useMutation({
    mutationFn: async ({ token, novaSenha }: { token: string; novaSenha: string }) => {
      const { data } = await api.post('/auth/resetar-senha', { token, novaSenha });
      return data;
    },
  });

  return {
    recuperarSenha: recuperarSenhaMutation.mutateAsync,
    isRecuperando: recuperarSenhaMutation.isPending,
    resetarSenha: resetarSenhaMutation.mutateAsync,
    isResetando: resetarSenhaMutation.isPending,
    error: recuperarSenhaMutation.error || resetarSenhaMutation.error,
  };
};
