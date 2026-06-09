/** Configuração do ERP Conta Azul no app_kv. */
export interface ContaAzulConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  apiCobrancasAtiva?: boolean;
}
