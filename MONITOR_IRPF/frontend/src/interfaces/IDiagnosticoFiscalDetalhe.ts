export interface DiagnosticoFiscalDetalhe {
  cpf: string;
  nome: string;
  ano_calendario: number;
  situacao: string;
  situacao_label: string;
  consultado_em: string | null;
  resultado: Record<string, unknown> | null;
  historico: { consultado_em?: string; situacao?: string; situacao_label?: string; ok?: boolean }[];
}