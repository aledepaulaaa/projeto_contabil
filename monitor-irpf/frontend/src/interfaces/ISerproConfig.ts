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
  /** Habilita a API "Integra Procurações" (API 1). */
  apiProcuracoesAtiva?: boolean;
  /** Habilita a API "Integra Sicalc" (API 2). */
  apiDarfAtiva?: boolean;
  /** Habilita a API "Integra Caixa Postal" (API 3). */
  apiMensagensEcacAtiva?: boolean;
  /** Habilita a API "Integra Pagamento" (API 4). */
  apiDebitosAtiva?: boolean;
  /** Habilita a API "Integra Sitfis" (API 5). */
  apiDiagnosticoFiscalAtiva?: boolean;
}
