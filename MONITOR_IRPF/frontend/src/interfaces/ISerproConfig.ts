/** Configuração da integração SERPRO no app_kv. */
export interface SerproConfig {
  enabled: boolean;
  consumerKey: string;
  consumerSecret: string;
  baseUrl: string;
  authUrl: string;
  roleType: string;
  certPassword?: string;
  hasCert?: boolean;
  hasPrivateKey?: boolean;
}
