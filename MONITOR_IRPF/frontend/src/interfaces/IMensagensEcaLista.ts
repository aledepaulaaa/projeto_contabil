import { MensagensEcacItem } from "./IMensagensEcaItem";

export interface MensagensEcacLista {
  ano_calendario: number;
  integracao_habilitada: boolean;
  itens: MensagensEcacItem[];
}