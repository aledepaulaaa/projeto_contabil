export interface RestituicaoItem {
  declaracao_id: number;
  titular_nome: string;
  titular_cpf: string | null;
  data_entrega: string | null;
  numero_recibo: string | null;
  valor_restituicao: string | number;
  status_restituicao: string;
  status_restituicao_label: string;
  status_processamento_rfb: string | null;
  em_malha: boolean;
  restituicao_consultado_em: string | null;
}