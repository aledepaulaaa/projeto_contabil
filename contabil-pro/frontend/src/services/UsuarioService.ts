import { apiClient } from './apiClient';

export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  papel: string;
  departamentoId?: string;
}

export const UsuarioService = {
  /** Lista usuários do tenant atual montados para seleção (Transferência) */
  listarUsuarios: async (departamentoId?: string): Promise<UsuarioResponse[]> => {
    // Usamos o X-EmpresaLocataria-Id no header conforme a UsuarioGestaoController
    const tenantId = localStorage.getItem('tenant_id') || 'dev-tenant';
    const params = departamentoId ? { departamentoId } : {};
    
    // Na controller o header é X-EmpresaLocataria-Id, no interceptor do apiClient costuma ser X-Tenant-ID
    // Vamos garantir que o header esperado pela controller seja enviado
    const { data } = await apiClient.get<UsuarioResponse[]>('/api/usuarios', { 
        params,
        headers: {
            'X-EmpresaLocataria-Id': tenantId
        }
    });
    return data;
  }
};
