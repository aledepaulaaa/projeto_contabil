import { apiClient } from './apiClient';

export interface AutenticacaoResponse {
  token: string;
  type?: string;
  empresaLocatariaId?: string;
}

export interface AutenticacaoData {
  usuario: string;
  senha?: string;
}

export const AutenticacaoService = {
  login: async (dados: AutenticacaoData): Promise<AutenticacaoResponse> => {
    // A API mapeia /api/auth/login e espera username, password, empresaLocatariaId
    const payload = {
      username: dados.usuario,
      password: dados.senha || '',
      empresaLocatariaId: dados.usuario, // Mapeado no identificador para atender multi-tenant
    };

    const response = await apiClient.post<AutenticacaoResponse>('/api/auth/login', payload);

    // Ajusta o retorno para usar a nomenclatura correta
    return {
      token: response.data.token,
      empresaLocatariaId: response.data.empresaLocatariaId || dados.usuario,
    };
  },
};
