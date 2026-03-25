import { apiClient } from './apiClient';

export interface LeadData {
  nome: string;
  email: string;
  cnpj: string;
  nomeEmpresa?: string;
  senha?: string;
  origem?: string;
  tipoServico?: string;
}

export interface EventoHistorico {
  id: string;
  tipo: string;
  descricao: string;
  marcador: 'SUCESSO' | 'ATENCAO' | 'NEUTRO';
  ocorridoEm: string;
}

export interface HistoricoLeadResponse {
  leadId: string;
  eventos: EventoHistorico[];
}

export interface ContratoResponse {
  id: string;
  leadId: string;
  status: string;
  criadoEm: string;
}

export const LeadService = {
  criarConta: async (dados: LeadData) => {
    const payload = {
      nomeContato: dados.nome,
      email: dados.email,
      cnpj: dados.cnpj,
      nomeEmpresa: dados.nomeEmpresa || dados.nome,
      origem: dados.origem || null,
      tipoServico: dados.tipoServico || null,
      senha: dados.senha
    };

    const { data } = await apiClient.post('/api/leads', payload);
    return data;
  },

  listarLeads: async () => {
    const { data } = await apiClient.get('/api/leads');
    return data.content || data;
  },

  sincronizarERP: async (id: string) => {
    const { data } = await apiClient.post(`/api/leads/${id}/onboarding`);
    return data;
  },

  /** Busca o histórico de vida do Lead (Timeline) */
  buscarHistorico: async (id: string): Promise<HistoricoLeadResponse> => {
    const { data } = await apiClient.get(`/api/leads/${id}/historico`);
    return data;
  },

  /** Cria um contrato vinculado ao Lead */
  criarContrato: async (id: string): Promise<ContratoResponse> => {
    const { data } = await apiClient.post(`/api/leads/${id}/contrato`);
    return data;
  },

  /** Importa leads via arquivo CSV */
  importarLeads: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/api/leads/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }
};
