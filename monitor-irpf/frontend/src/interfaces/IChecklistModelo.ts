import { ChecklistItem } from "./IChecklistItem";

export interface ChecklistModelo {
  id: number;
  nome: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
  itens: ChecklistItem[];
}