import { TipoCobrancaPadrao } from "../types/TTipoCobrancaPadrao";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

export const TIPO_PRECIFICACAO_LABEL: Record<TipoPrecificacaoCliente, string> = {
  padrao: "Valor padrão",
  minimo: "Valor mínimo",
  maximo: "Valor máximo",
  personalizado: "Valor personalizado",
  bonificado: "Bonificado",
};

export const TIPO_PRECIFICACAO_OPTIONS: { value: TipoPrecificacaoCliente; label: string }[] = (
  Object.entries(TIPO_PRECIFICACAO_LABEL) as [TipoPrecificacaoCliente, string][]
).map(([value, label]) => ({ value, label }));

const TIPOS_PADRAO_ORDER: TipoCobrancaPadrao[] = ["padrao", "minimo", "maximo", "bonificado"];

export const TIPO_COBRANCA_PADRAO_OPTIONS: { value: TipoCobrancaPadrao; label: string }[] = TIPOS_PADRAO_ORDER.map(
  (value) => ({ value, label: TIPO_PRECIFICACAO_LABEL[value] }),
);
