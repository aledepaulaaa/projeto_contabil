import { apiClient as api } from './apiClient';

export interface ContratoResponse {
  id: string;
  leadId: string;
  status: string;
  nomeContato: string | null;
  emailContato: string | null;
  nomeEmpresa: string | null;
  leadStatus: string | null;
  urlDocumentoZapSign: string | null;
  motivoCancelamento: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
}

const ContratoService = {
  listarContratos: async (): Promise<ContratoResponse[]> => {
    const { data } = await api.get('/api/contratos');
    return data;
  },

  buscarPorId: async (id: string): Promise<ContratoResponse> => {
    const { data } = await api.get(`/api/contratos/${id}`);
    return data;
  },

  ativarContrato: async (id: string): Promise<ContratoResponse> => {
    const { data } = await api.patch(`/api/contratos/${id}/ativar`);
    return data;
  },

  cancelarContrato: async (id: string, motivo: string): Promise<ContratoResponse> => {
    const { data } = await api.patch(`/api/contratos/${id}/cancelar`, null, {
      params: { motivo },
    });
    return data;
  },

  retentarContrato: async (id: string): Promise<ContratoResponse> => {
    const { data } = await api.patch(`/api/contratos/${id}/retentar`);
    return data;
  },
  
  arquivarContrato: async (id: string): Promise<ContratoResponse> => {
    const { data } = await api.patch(`/api/contratos/${id}/arquivar`);
    return data;
  },

  excluirContrato: async (id: string): Promise<void> => {
    await api.delete(`/api/contratos/${id}`);
  },
};

export default ContratoService;
