import { DocumentoEntregaItem } from "./IDocumentoEntregaItem";

export interface ClienteDocumentacaoDetalhe {
  cliente_manual_id: number;
  nome: string;
  modelo_id: number;
  modelo_nome: string;
  documentacao_id: number;
  percentual: number;
  itens: DocumentoEntregaItem[];
  portal_url: string;
  portal_bloqueado: boolean;
}