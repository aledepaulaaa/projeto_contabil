import { DeclaracaoStatus } from "../types/TDeclaracaoStatus";
import { ResultadoFiscal } from "../types/TResultadoFiscal";

export interface Declaracao {
  id: number;
  ano_calendario: number;
  titular_nome: string;
  titular_cpf: string | null;
  status: DeclaracaoStatus;
  data_entrega: string | null;
  resultado_fiscal: ResultadoFiscal | null;
  valor_imposto_ou_restituicao: string | number | null;
  imposto_quantidade_parcelas?: number | null;
  imposto_debito_automatico?: boolean | null;
  rendimentos_tributaveis_total?: string | number | null;
  rendimentos_isentos_total?: string | number | null;
  patrimonio_liquido_declarado?: string | number | null;
  status_processamento_rfb: string | null;
  observacoes_monitoramento: string | null;
  observacoes: string | null;
  caminho_arquivo_declaracao: string | null;
  caminho_arquivo_recibo: string | null;
  created_at: string;
  updated_at: string;
  usuario_responsavel_id: number | null;
}