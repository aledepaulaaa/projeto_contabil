export type RestituicaoStatusCode = "a_restituir" | "pendente" | "restituido" | "erro_credito";

export const RESTITUICAO_STATUS_LABEL: Record<RestituicaoStatusCode, string> = {
  a_restituir: "A restituir",
  pendente: "Pendente",
  restituido: "Restituído",
  erro_credito: "Erro ao creditar",
};

export function restituicaoStatusBadgeClass(code: string): string {
  if (code === "a_restituir") return "badge-rest badge-rest-a-restituir";
  if (code === "pendente") return "badge-rest badge-rest-pendente";
  if (code === "restituido") return "badge-rest badge-rest-restituido";
  if (code === "erro_credito") return "badge-rest badge-rest-erro";
  return "badge-rest badge-rest-desconhecido";
}

export function restituicaoStatusLabel(code: string): string {
  return RESTITUICAO_STATUS_LABEL[code as RestituicaoStatusCode] ?? code;
}
