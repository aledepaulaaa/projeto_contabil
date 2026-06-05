export interface DocumentoEntregaItem {
  checklist_item_id: number;
  titulo: string;
  descricao: string | null;
  obrigatorio: boolean;
  ordem: number;
  entregue: boolean;
  arquivo_nome?: string | null;
  uploaded_at?: string | null;
  entrega_id?: number | null;
  tamanho_bytes?: number | null;
}