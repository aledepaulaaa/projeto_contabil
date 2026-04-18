import { apiClient } from './apiClient';

export interface DepartamentoResponse {
  id: string;
  nome: string;
  descricao?: string;
}

export const DepartamentoService = {
  /** Lista departamentos do tenant atual */
  listar: async (): Promise<DepartamentoResponse[]> => {
    const tenantId = localStorage.getItem('tenant_id') || 'dev-tenant';
    const { data } = await apiClient.get<DepartamentoResponse[]>('/api/departamentos', {
        headers: {
            'X-EmpresaLocataria-Id': tenantId
        }
    });
    return data;
  },

  /** Cria um novo departamento para a empresa */
  criar: async (nome: string, descricao?: string): Promise<DepartamentoResponse> => {
    const tenantId = localStorage.getItem('tenant_id') || 'dev-tenant';
    const { data } = await apiClient.post<DepartamentoResponse>('/api/departamentos', {
        nome,
        descricao
    }, {
        headers: {
            'X-EmpresaLocataria-Id': tenantId
        }
    });
    return data;
  },

  /** Exclui um departamento pelo ID */
  excluir: async (id: string): Promise<void> => {
    const tenantId = localStorage.getItem('tenant_id') || 'dev-tenant';
    await apiClient.delete(`/api/departamentos/${id}`, {
        headers: {
            'X-EmpresaLocataria-Id': tenantId
        }
    });
  }
};
