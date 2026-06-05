import { DiagnosticoFiscalItem } from "./IDiagnosticoFiscalItem";

export interface DiagnosticoFiscalLista {
  ano_calendario: number;
  rfb_habilitado: boolean;
  itens: DiagnosticoFiscalItem[];
}