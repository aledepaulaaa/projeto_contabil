import { apiClient as api } from './apiClient';

export interface DadoRendaResponse {
  codigo: string;
  texto: string;
  valor: string;
}

export interface RendaContribuinteResponse {
  titular: string;
  destinatario: string;
  dataHoraRegistro: string | null;
  token: string;
  avisoLegal: string;
  dados: DadoRendaResponse[];
}

const SerproService = {
  consultarRenda: async (token: string): Promise<RendaContribuinteResponse> => {
    const { data } = await api.get(`/api/serpro/consulta-renda/${token}`);
    return data;
  }
};

export default SerproService;
