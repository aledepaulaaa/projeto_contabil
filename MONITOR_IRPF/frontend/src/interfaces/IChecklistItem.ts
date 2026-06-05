export interface ChecklistItem {
  id: number;
  modelo_id: number;
  titulo: string;
  descricao: string | null;
  ordem: number;
  obrigatorio: boolean;
}