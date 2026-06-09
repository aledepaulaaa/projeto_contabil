/** Configuração Asaas em app_kv (apiKey mascarada no GET). */
export interface AsaasConfig {
  enabled: boolean;
  sandboxMode?: boolean;
  productionApiKey?: string;
  sandboxApiKey?: string;
  billingType?: string;
  dueDays?: number;
  descriptionTemplate?: string;
}