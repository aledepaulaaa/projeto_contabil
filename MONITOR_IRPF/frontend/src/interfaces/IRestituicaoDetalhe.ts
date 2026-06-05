import { RestituicaoEvento } from "./IRestituicaoEvento";

export interface RestituicaoDetalhe {
  declaracao_id: number;
  ano_calendario: number;
  titular_nome: string;
  titular_cpf: string | null;
  data_entrega: string | null;
  numero_recibo: string | null;
  valor_restituicao: string | number;
  status_restituicao: string;
  status_restituicao_label: string;
  status_processamento_rfb: string | null;
  em_malha: boolean;
  restituicao_paga: boolean | null;
  data_pagamento_restituicao: string | null;
  restituicao_erro_motivo: string | null;
  observacao: string | null;
  historico: RestituicaoEvento[];
  restituicao_consultado_em: string | null;
  fonte_consulta: string;
}