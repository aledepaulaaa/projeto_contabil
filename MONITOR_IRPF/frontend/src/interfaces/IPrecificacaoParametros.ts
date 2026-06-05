import { TipoCobrancaPadrao } from "../types/TTipoCobrancaPadrao";
import { PersonalizadoEscalonamento } from "./IPersonalizadoEscalonamento";

export interface PrecificacaoParametros {
  valor_padrao: string;
  valor_minimo: string;
  valor_maximo: string;
  /** Referência geral; o valor cobrado em «personalizado» é o do cadastro do cliente. */
  valor_personalizado_referencia: string;
  personalizado_escalonamento: PersonalizadoEscalonamento;
  valor_bonificado: string;
  tipo_cobranca_padrao: TipoCobrancaPadrao;
}
