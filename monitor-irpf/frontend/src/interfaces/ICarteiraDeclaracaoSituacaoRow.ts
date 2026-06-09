import { SituacaoDeclaracaoCarteira } from "../types/TSituacaoDeclaracaoCarteira";

export interface CarteiraDeclaracaoSituacaoRow {
  estado_key: string;
  nome: string;
  cpf_exibicao: string | null;
  manual_id: number;
  ativo: boolean;
  situacao_declaracao: SituacaoDeclaracaoCarteira;
  /** ISO date (YYYY-MM-DD) quando «válido até» aplica. */
  validade_ate: string | null;
  token?: string | null;
  status_real?: string | null;
}