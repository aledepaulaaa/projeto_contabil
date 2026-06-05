from datetime import datetime

from pydantic import BaseModel, Field


class DocumentoClienteRowOut(BaseModel):
    cliente_manual_id: int
    nome: str
    cpf: str | None
    telefone: str | None
    ativo: bool
    modelo_id: int | None = None
    modelo_nome: str | None = None
    documentacao_id: int | None = None
    total_itens: int = 0
    itens_entregues: int = 0
    percentual: int = 0
    ultimo_upload_em: datetime | None = None
    portal_url: str | None = None
    portal_bloqueado: bool = False
    tem_entregas: bool = False


class AtribuirChecklistIn(BaseModel):
    modelo_id: int


class PortalLinkOut(BaseModel):
    token: str
    portal_url: str
    regenerado: bool = False


class DocumentoEntregaOut(BaseModel):
    checklist_item_id: int
    titulo: str
    descricao: str | None
    obrigatorio: bool
    ordem: int
    entregue: bool
    arquivo_nome: str | None = None
    uploaded_at: datetime | None = None
    entrega_id: int | None = None
    tamanho_bytes: int | None = None


class ClienteDocumentacaoDetalheOut(BaseModel):
    cliente_manual_id: int
    nome: str
    modelo_id: int
    modelo_nome: str
    documentacao_id: int
    percentual: int
    itens: list[DocumentoEntregaOut]
    portal_url: str
    portal_bloqueado: bool = False


class PortalPublicoOut(BaseModel):
    titulo_portal: str
    percentual: int
    itens: list[DocumentoEntregaOut]
    portal_bloqueado: bool = False


class PortalBloqueioIn(BaseModel):
    bloqueado: bool
