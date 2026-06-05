export interface DarfGerarResult {
  declaracao_id: number;
  ano_calendario: number;
  titular_nome: string;
  titular_cpf: string | null;
  parcela: number;
  total_parcelas: number;
  valor_parcela: string | number;
  valor_imposto_total: string | number;
  debito_automatico: boolean;
  referencia: string;
  message: string;
}