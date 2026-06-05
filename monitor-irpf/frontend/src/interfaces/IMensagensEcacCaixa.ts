import { MensagemEcac } from "./IMensagemEcac";

export interface MensagensEcacCaixa {
  cpf: string;
  nome: string;
  ano_calendario: number;
  total_mensagens: number;
  nao_lidas: number;
  mensagens: MensagemEcac[];
}