import { ClienteListRow } from "../interfaces/IClienteListRow";
import { PrecificacaoParametros } from "../interfaces/IPrecificacaoParametros";
import { TipoPrecificacaoCliente } from "../types/TTipoPrecificacaoCliente";

function parseMoneyApi(v: string | number): number {
  return Number(String(v).replace(",", ".")) || 0;
}

/** Valor de honorário a mostrar em Precificação e Cobrança (tabela de preferências ou cadastro). */
export function valorHonorarioCliente(
  row: ClienteListRow,
  p: PrecificacaoParametros,
): { valor: number | null; fonte: "preferencias" | "cadastro_cliente" } {
  const tipo = (row.tipo_precificacao ?? "padrao") as TipoPrecificacaoCliente;
  if (tipo === "personalizado") {
    const v = row.valor_personalizado;
    if (v == null || String(v).trim() === "") {
      return { valor: null, fonte: "cadastro_cliente" };
    }
    return { valor: Number(v), fonte: "cadastro_cliente" };
  }
  switch (tipo) {
    case "padrao":
      return { valor: parseMoneyApi(p.valor_padrao), fonte: "preferencias" };
    case "minimo":
      return { valor: parseMoneyApi(p.valor_minimo), fonte: "preferencias" };
    case "maximo":
      return { valor: parseMoneyApi(p.valor_maximo), fonte: "preferencias" };
    case "bonificado":
      return { valor: parseMoneyApi(p.valor_bonificado), fonte: "preferencias" };
    default:
      return { valor: parseMoneyApi(p.valor_padrao), fonte: "preferencias" };
  }
}

export function formatBRL(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
