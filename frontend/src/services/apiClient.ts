import axios from 'axios';
import { useGlobalErrorStore } from '../store/globalErrorStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: injeta Token e TenantId
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-EmpresaLocataria-Id'] = tenantId;
  }
  return config;
});

/**
 * Interceptor de Response: captura erros 500 e popula o GlobalErrorStore.
 * Silencia console.error padrão para evitar poluição visual no navegador.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const method = error.config?.method?.toLowerCase();

      if (status >= 500) {
        const mensagem = data?.mensagem || 'Erro interno do servidor. Tente novamente.';
        const protocolo = data?.protocolo || null;

        if (method !== 'get') {
          // Popula o store global silenciosamente para acionar o modal
          useGlobalErrorStore.getState().setError(mensagem, status, protocolo);
        } else {
          // Apenas um log silencioso no terminal para o dev (GET errors)
          console.error('[Silent Developer Log] Erro 500 (GET) ocultado da UI pelo interceptor.', { mensagem, protocolo });
        }

        // Retorna rejection sem travar a navegação (Silent Error)
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
