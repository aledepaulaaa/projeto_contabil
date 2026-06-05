import { MalhaPendencia } from "./IMalhaPendencia";

export interface MalhaDetalhe {
  declaracao_id: number;
  ano_calendario: number;
  titular_nome: string;
  titular_cpf: string | null;
  data_entrega: string | null;
  numero_recibo: string | null;
  status_processamento_rfb: string | null;
  em_malha: boolean;
  malha_motivo_rfb: string | null;
  pendencias: MalhaPendencia[];
  malha_consultado_em: string | null;
  fonte_consulta: string;
}
