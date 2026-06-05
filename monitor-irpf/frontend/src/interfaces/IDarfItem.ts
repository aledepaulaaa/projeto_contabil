export interface DarfItem {
  declaracao_id: number;
  titular_nome: string;
  titular_cpf: string | null;
  valor_imposto: string | number;
  quantidade_parcelas: number;
  debito_automatico: boolean;
}