export interface DiagnosticoFiscalItem {
  cpf: string;
  nome: string;
  situacao: string;
  situacao_label: string;
  email: string | null;
  telefone: string | null;
  consultado_em: string | null;
  tem_resultado: boolean;
}