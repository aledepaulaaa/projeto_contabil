import { DocumentoEntregaItem } from "./IDocumentoEntregaItem";

export interface PortalPublico {
  titulo_portal: string;
  percentual: number;
  itens: DocumentoEntregaItem[];
  portal_bloqueado?: boolean;
}
