/** Configuração Asaas em app_kv (apiKey mascarada no GET). */
export interface AsaasConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  billingType?: string;
  dueDays?: number;
  descriptionTemplate?: string;
}