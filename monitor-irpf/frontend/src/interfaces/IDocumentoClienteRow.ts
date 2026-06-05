export interface DocumentoClienteRow {
  cliente_manual_id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  ativo: boolean;
  modelo_id?: number | null;
  modelo_nome?: string | null;
  documentacao_id?: number | null;
  total_itens: number;
  itens_entregues: number;
  percentual: number;
  ultimo_upload_em?: string | null;
  portal_url?: string | null;
  portal_bloqueado?: boolean;
  tem_entregas?: boolean;
}