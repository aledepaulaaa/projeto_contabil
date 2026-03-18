import { apiClient } from './apiClient';

export interface AutenticacaoResponse {
  token: string;
  type?: string;
  tenantId?: string;
}

export interface AutenticacaoData {
  usuario: string;
  senha?: string;
}

export const AutenticacaoService = {
  login: async (dados: AutenticacaoData): Promise<AutenticacaoResponse> => {
    // A API mapeia /api/auth/login e espera username, password, tenantId
    const payload = {
      username: dados.usuario,
      password: dados.senha || '',
      tenantId: dados.usuario, // Mapeado no identificador para atender multi-tenant
    };

    const response = await apiClient.post<AutenticacaoResponse>('/api/auth/login', payload);

    return {
      token: response.data.token,
      tenantId: dados.usuario,
    };
  },
};
