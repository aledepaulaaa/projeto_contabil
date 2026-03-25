import { apiClient } from './apiClient';

export interface GoogleAdsStatusResponse {
  connected: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE' | null;
}

export const GoogleAdsService = {
  /**
   * Verifica o status da conexão com Google Ads para o tenant atual.
   */
  buscarStatus: async (tenantId: string): Promise<GoogleAdsStatusResponse> => {
    const { data } = await apiClient.get<GoogleAdsStatusResponse>(`/api/v1/integrations/google-ads/status`, {
      params: { tenant_id: tenantId }
    });
    return data;
  },

  /**
   * Inicia o fluxo de autorização OAuth2 redirecionando para o Google.
   */
  conectar: (tenantId: string) => {
    // Redirecionamento direto via browser para o endpoint de autorização do backend
    window.location.href = `http://localhost:8080/api/v1/integrations/google-ads/authorize?tenant_id=${tenantId}`;
  }
};
