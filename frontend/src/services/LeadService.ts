import { apiClient } from './apiClient';

export interface LeadData {
  nome: string;
  email: string;
  cnpj: string;
  senha?: string;
}

export const LeadService = {
  criarConta: async (dados: LeadData) => {
    const payload = {
      nomeContato: dados.nome,
      email: dados.email,
      cnpj: dados.cnpj,
      nomeEmpresa: dados.nome, // Mapeado para o nome da empresa no onboarding
      senha: dados.senha
    };

    const { data } = await apiClient.post('/api/leads', payload);
    return data;
  },

  listarLeads: async () => {
    const { data } = await apiClient.get('/api/leads');
    // A API retorna um Map com a lista dentro de "content" ou similar dependendo da paginação
    // No LeadController.java atual parece que retorna um Map com "content", "totalPages", etc.
    return data.content || data;
  },

  sincronizarERP: async (id: string) => {
    // Sincroniza com Conta Azul (Fase inicial do ERP Sincronizador)
    const { data } = await apiClient.post(`/api/leads/${id}/onboarding`);
    return data;
  }
};
