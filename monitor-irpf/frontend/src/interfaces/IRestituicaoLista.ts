import { RestituicaoItem } from "./IRestituicaoItem";

export interface RestituicaoLista {
  ano_calendario: number;
  itens: RestituicaoItem[];
}