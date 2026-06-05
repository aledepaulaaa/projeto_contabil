export interface MensagensEcacItem {
  cpf: string;
  nome: string;
  total_mensagens: number;
  nao_lidas: number;
  status_label: string;
  todas_lidas: boolean;
  email: string | null;
  telefone: string | null;
  consultado_em: string | null;
}