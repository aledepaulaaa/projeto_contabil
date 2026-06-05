export interface ChecklistItemIn {
  titulo: string;
  descricao?: string | null;
  ordem?: number;
  obrigatorio?: boolean;
}