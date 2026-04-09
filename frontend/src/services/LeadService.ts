import { apiClient } from './apiClient';

export interface LeadData {
  nome: string;
  email: string;
  cnpj: string;
  telefone?: string;
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
  arquivado: boolean;
  eventos: EventoHistorico[];
}

export interface ContratoResponse {
  id: string;
  leadId: string;
  status: string;
  criadoEm: string;
}

export interface NotificacaoDownload {
  id: string;
  nomeArquivo: string;
  formato: string;
  urlDownload: string;
  geradoEm: string;
  lido: boolean;
  tipo: 'DOWNLOAD' | 'CONTRATO';
}

export const LeadService = {
  cadastrarLead: async (dados: LeadData) => {
    return LeadService.criarConta(dados);
  },

  criarConta: async (dados: LeadData) => {
    const payload = {
      nomeContato: dados.nome,
      email: dados.email,
      cnpj: dados.cnpj,
      telefone: dados.telefone,
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
    return data;
  },

  atualizarLead: async (id: string, dados: LeadData) => {
    const payload = {
      nomeContato: dados.nome,
      email: dados.email,
      cnpj: dados.cnpj,
      telefone: dados.telefone,
      nomeEmpresa: dados.nomeEmpresa || dados.nome,
      origem: dados.origem || null,
      tipoServico: dados.tipoServico || null
    };
    const { data } = await apiClient.put(`/api/leads/${id}`, payload);
    return data;
  },

  excluirLead: async (id: string) => {
    await apiClient.delete(`/api/leads/${id}`);
  },

  moverLead: async (id: string, status: string, observacao?: string) => {
    let url = `/api/leads/${id}/status?status=${status}`;
    if (observacao) {
      url += `&observacao=${encodeURIComponent(observacao)}`;
    }
    const { data } = await apiClient.patch(url);
    return data;
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

  limparHistorico: async (id: string | null) => {
    if (id) {
      await apiClient.delete(`/api/leads/${id}/historico`);
    } else {
      await apiClient.delete('/api/leads/historico');
    }
  },

  arquivarHistorico: async (id: string, arquivar: boolean) => {
    await apiClient.patch(`/api/leads/${id}/historico/arquivar?arquivar=${arquivar}`);
  },

  exportarCsv: async (id: string) => {
    const response = await apiClient.get(`/api/leads/${id}/historico/export/csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_${id}.csv`);
    document.body.appendChild(link);
    link.click();
  },

  exportarPdf: async (id: string) => {
    const response = await apiClient.get(`/api/leads/${id}/historico/export/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportarHistoricoGeralCsv: async () => {
    const response = await apiClient.get('/api/leads/historico/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'historico_geral.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportarHistoricoGeralPdf: async () => {
    const response = await apiClient.get('/api/leads/historico/export/pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'historico_geral.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /** Cria um contrato vinculado ao Lead */
  criarContrato: async (id: string): Promise<ContratoResponse> => {
    const { data } = await apiClient.post(`/api/leads/${id}/contrato`);
    return data;
  },

  /** Busca o histórico global de atividades do Tenant */
  buscarHistoricoGlobal: async (): Promise<EventoHistorico[]> => {
    const { data } = await apiClient.get('/api/leads/historico');
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
  },

  /** Solicita a geração de um relatório */
  solicitarRelatorio: async (params: { formato: string, inicio: string, fim: string }) => {
    const { data } = await apiClient.post('/api/relatorios/gerar', params);
    return data;
  },

  /** Lista notificações de downloads prontos */
  listarNotificacoes: async (): Promise<NotificacaoDownload[]> => {
    const { data } = await apiClient.get('/api/relatorios/notificacoes');
    return data;
  },

  /** Marca notificação como lida */
  marcarNotificacaoLido: async (id: string) => {
    await apiClient.post(`/api/relatorios/notificacoes/${id}/ler`);
  },

  /** Limpa todas as notificações do usuário */
  limparNotificacoes: async () => {
    await apiClient.delete('/api/relatorios/notificacoes');
  },

  /** Baixa um arquivo a partir de uma URL */
  baixarArquivo: async (url: string, filename: string) => {
    const response = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /** Aciona a geração manual de contrato para um lead em FECHAMENTO */
  gerarContrato: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/api/leads/${id}/gerar-contrato`);
    return data;
  },

  /** Busca a lista de contatos (Leads) formatados para o módulo de Atendimento */
  getContatosAtendimento: async (): Promise<any[]> => {
    const { data } = await apiClient.get('/api/leads/contatos');
    return data;
  },

  /** Busca o histórico de chat do Lead */
  getChatHistory: async (leadId: string): Promise<any[]> => {
    const { data } = await apiClient.get(`/api/whatsapp/webhook/${leadId}`);
    return data;
  },

  /** Marca as mensagens do WhatsApp como lidas */
  marcarMensagensLidas: async (leadId: string): Promise<void> => {
    await apiClient.patch(`/api/whatsapp/leads/${leadId}/read`);
  },
};
