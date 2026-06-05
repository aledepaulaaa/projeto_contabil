export interface MalhaItem {
  declaracao_id: number;
  titular_nome: string;
  titular_cpf: string | null;
  data_entrega: string | null;
  numero_recibo: string | null;
  status_processamento_rfb: string | null;
  malha_motivo_resumo: string | null;
  malha_consultado_em: string | null;
}