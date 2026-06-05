import { ClienteOrigemCadastro } from "../types/TClienteOrigemCadastro";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

export interface ClienteListRow {
  estado_key: string;
  origem_cadastro: ClienteOrigemCadastro | string;
  nome: string;
  cpf_exibicao: string | null;
  declaracoes_count: number | null;
  manual_id: number;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
  cpf_digits: string | null;
  ativo: boolean;
  honorarios_em_aberto: boolean;
  tem_declaracao_exercicio: boolean;
  tem_procuracao_exercicio: boolean;
  /** Nomes dos usuários responsáveis nas declarações do exercício (texto único). */
  declaracao_responsaveis: string | null;
  tipo_precificacao: TipoPrecificacaoCliente;
  valor_personalizado: string | number | null;
  /** ID do cliente no Asaas (cus_…), para gerar cobrança em Precificação e Cobrança. */
  asaas_customer_id?: string | null;
}