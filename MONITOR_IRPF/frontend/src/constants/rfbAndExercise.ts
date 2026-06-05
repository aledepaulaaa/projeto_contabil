/** Ano-calendário IRPF e labels de status RFB — partilhado entre Declarações e Dashboard. */

export const ANO_MIN = 2020;
export const ANO_MAX = 2032;

/** Mesma chave em Clientes e Procurações para o ano da carteira na sessão. */
export const SESSION_CARTEIRA_ANO_KEY = "irpf_clientes_ano_calendario";

export function readStoredCarteiraAno(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_CARTEIRA_ANO_KEY);
    if (raw != null) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n) && n >= ANO_MIN && n <= ANO_MAX) {
        return n;
      }
    }
  } catch {
    /* sessão indisponível */
  }
  return Math.min(ANO_MAX, Math.max(ANO_MIN, defaultExerciseYear()));
}

export function defaultExerciseYear(): number {
  return new Date().getFullYear() - 1;
}

export function anoExercicioLabel(ano: number): string {
  return `${ano}/${ano + 1}`;
}

export const RFB_STATUS_CODES = [
  "em_processamento",
  "processada",
  "fila_restituicao",
  "pendencia_malha",
  "retificada",
  "cancelada",
] as const;

export type RfbStatusCode = (typeof RFB_STATUS_CODES)[number];

export const RFB_STATUS_META: Record<RfbStatusCode, { title: string; hint: string }> = {
  em_processamento: { title: "Em Processamento", hint: "recebida" },
  processada: { title: "Processada", hint: "concluída" },
  fila_restituicao: { title: "Em Fila de Restituição", hint: "aguardando pagamento" },
  pendencia_malha: { title: "Com Pendência", hint: "Malha Fina" },
  retificada: { title: "Retificada", hint: "substituída" },
  cancelada: { title: "Cancelada", hint: "" },
};

export function rfbStatusBadgeClass(code: string): string {
  if (RFB_STATUS_CODES.includes(code as RfbStatusCode)) {
    return `badge-rfb badge-rfb-${code}`;
  }
  return "badge-rfb badge-rfb-desconhecido";
}
