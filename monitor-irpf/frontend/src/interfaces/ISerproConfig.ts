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
  /** Habilita a API "Consultar Renda" (dados cadastrais, ocupação e rendimentos). */
  apiRendaAtiva?: boolean;
  /** Habilita a API "Consultar Restituição IRPF". */
  apiRestituicaoAtiva?: boolean;
  /** Controla se usa o ambiente sandbox (trial) ou produção. */
  sandboxMode?: boolean;
}
