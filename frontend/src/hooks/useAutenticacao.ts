import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGlobalErrorStore } from '../store/globalErrorStore';
import { AutenticacaoService } from '../services/AutenticacaoService';
import { AxiosError } from 'axios';

export function useAutenticacao() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { setError, clearError } = useGlobalErrorStore();

  const handleLogin = async (usuario: string, senha?: string) => {
    setLoading(true);
    clearError();
    try {
      const resp = await AutenticacaoService.login({ usuario, senha });
      login(resp.token, resp.tenantId || usuario);
      return true;
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.response?.status === 429) {
          setError('Muitas tentativas. Aguarde e tente novamente.', 429);
        } else if (e.response?.status === 401 || e.response?.status === 403) {
          setError('Credenciais inválidas.', e.response?.status);
        } else {
          setError('Erro ao conectar ao servidor.', e.response?.status || 500);
        }
      } else {
        setError('Ocorreu um erro inesperado.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleLogin };
}
