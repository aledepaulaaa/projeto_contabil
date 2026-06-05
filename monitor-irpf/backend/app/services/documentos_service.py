import secrets
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.checklist import (
    ChecklistItem,
    ChecklistModelo,
    ClienteDocumentacao,
    ClienteDocumentoEntrega,
)
from app.models.cliente_manual import ClienteManual
from app.schemas.documentos import (
    ClienteDocumentacaoDetalheOut,
    DocumentoClienteRowOut,
    DocumentoEntregaOut,
    PortalLinkOut,
    PortalPublicoOut,
)
from app.services.documentos_storage import delete_entrega_file, save_upload


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _portal_path(token: str) -> str:
    return f"/enviar-documentos/{token}"


def build_portal_url(base_origin: str, token: str) -> str:
    base = (base_origin or "").rstrip("/")
    path = _portal_path(token)
    if not base:
        return path
    return urljoin(f"{base}/", path.lstrip("/"))


def _calc_progress(itens: list[ChecklistItem], entregas: list[ClienteDocumentoEntrega]) -> tuple[int, int, int]:
    entrega_por_item = {e.checklist_item_id: e for e in entregas}
    total = len(itens)
    if total == 0:
        return 0, 0, 100
    ok = sum(1 for it in itens if it.id in entrega_por_item)
    pct = int(round(100 * ok / total))
    return total, ok, pct


def _ultimo_upload(entregas: list[ClienteDocumentoEntrega]) -> datetime | None:
    if not entregas:
        return None
    return max(e.uploaded_at for e in entregas)


def _itens_out(
    itens: list[ChecklistItem],
    entregas: list[ClienteDocumentoEntrega],
    *,
    incluir_entrega_id: bool = False,
) -> list[DocumentoEntregaOut]:
    entrega_por_item = {e.checklist_item_id: e for e in entregas}
    out: list[DocumentoEntregaOut] = []
    for it in sorted(itens, key=lambda x: (x.ordem, x.id)):
        ent = entrega_por_item.get(it.id)
        out.append(
            DocumentoEntregaOut(
                checklist_item_id=it.id,
                titulo=it.titulo,
                descricao=it.descricao,
                obrigatorio=it.obrigatorio,
                ordem=it.ordem,
                entregue=ent is not None,
                arquivo_nome=ent.arquivo_nome if ent else None,
                uploaded_at=ent.uploaded_at if ent else None,
                entrega_id=ent.id if ent and incluir_entrega_id else None,
                tamanho_bytes=ent.tamanho_bytes if ent and incluir_entrega_id else None,
            ),
        )
    return out


class DocumentosService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_clientes(self, ano: int, base_origin: str) -> list[DocumentoClienteRowOut]:
        clientes = self._db.execute(
            select(ClienteManual).where(ClienteManual.ano_carteira == ano).order_by(ClienteManual.nome),
        ).scalars().all()

        docs = self._db.execute(
            select(ClienteDocumentacao)
            .options(
                selectinload(ClienteDocumentacao.entregas),
            ),
        ).scalars().all()
        doc_por_cliente = {d.cliente_manual_id: d for d in docs}

        modelo_ids = {d.modelo_id for d in docs}
        modelos = {}
        if modelo_ids:
            for m in self._db.execute(select(ChecklistModelo).where(ChecklistModelo.id.in_(modelo_ids))).scalars():
                modelos[m.id] = m

        itens_por_modelo: dict[int, list[ChecklistItem]] = {}
        if modelo_ids:
            for it in self._db.execute(
                select(ChecklistItem).where(ChecklistItem.modelo_id.in_(modelo_ids)).order_by(ChecklistItem.ordem),
            ).scalars():
                itens_por_modelo.setdefault(it.modelo_id, []).append(it)

        rows: list[DocumentoClienteRowOut] = []
        for c in clientes:
            doc = doc_por_cliente.get(c.id)
            if doc is None:
                rows.append(
                    DocumentoClienteRowOut(
                        cliente_manual_id=c.id,
                        nome=c.nome,
                        cpf=c.cpf,
                        telefone=c.telefone,
                        ativo=c.ativo,
                    ),
                )
                continue
            modelo = modelos.get(doc.modelo_id)
            itens = itens_por_modelo.get(doc.modelo_id, [])
            total, ok, pct = _calc_progress(itens, list(doc.entregas))
            entregas_list = list(doc.entregas)
            rows.append(
                DocumentoClienteRowOut(
                    cliente_manual_id=c.id,
                    nome=c.nome,
                    cpf=c.cpf,
                    telefone=c.telefone,
                    ativo=c.ativo,
                    modelo_id=doc.modelo_id,
                    modelo_nome=modelo.nome if modelo else None,
                    documentacao_id=doc.id,
                    total_itens=total,
                    itens_entregues=ok,
                    percentual=pct,
                    ultimo_upload_em=_ultimo_upload(entregas_list),
                    portal_url=build_portal_url(base_origin, doc.token),
                    portal_bloqueado=bool(doc.portal_bloqueado),
                    tem_entregas=len(entregas_list) > 0,
                ),
            )
        return rows

    def get_cliente(self, cliente_id: int, base_origin: str) -> ClienteDocumentacaoDetalheOut | None:
        cliente = self._db.get(ClienteManual, cliente_id)
        if cliente is None:
            return None
        doc = self._db.execute(
            select(ClienteDocumentacao)
            .where(ClienteDocumentacao.cliente_manual_id == cliente_id)
            .options(selectinload(ClienteDocumentacao.entregas)),
        ).scalar_one_or_none()
        if doc is None:
            return None
        modelo = self._db.get(ChecklistModelo, doc.modelo_id)
        itens = list(
            self._db.execute(
                select(ChecklistItem).where(ChecklistItem.modelo_id == doc.modelo_id).order_by(ChecklistItem.ordem),
            ).scalars(),
        )
        _, _, pct = _calc_progress(itens, list(doc.entregas))
        return ClienteDocumentacaoDetalheOut(
            cliente_manual_id=cliente.id,
            nome=cliente.nome,
            modelo_id=doc.modelo_id,
            modelo_nome=modelo.nome if modelo else "—",
            documentacao_id=doc.id,
            percentual=pct,
            itens=_itens_out(itens, list(doc.entregas), incluir_entrega_id=True),
            portal_url=build_portal_url(base_origin, doc.token),
            portal_bloqueado=bool(doc.portal_bloqueado),
        )

    def set_portal_bloqueado(self, cliente_id: int, bloqueado: bool) -> ClienteDocumentacao:
        doc = self._db.execute(
            select(ClienteDocumentacao).where(ClienteDocumentacao.cliente_manual_id == cliente_id),
        ).scalar_one_or_none()
        if doc is None:
            raise HTTPException(status_code=400, detail="Cliente sem checklist atribuído.")
        doc.portal_bloqueado = bool(bloqueado)
        doc.updated_at = _utcnow()
        return doc

    def get_entrega_arquivo(self, entrega_id: int) -> tuple[Path, str, str | None]:
        ent = self._db.get(ClienteDocumentoEntrega, entrega_id)
        if ent is None:
            raise HTTPException(status_code=404, detail="Ficheiro não encontrado.")
        path = Path(ent.arquivo_path)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="Ficheiro não encontrado no disco.")
        return path, ent.arquivo_nome, ent.content_type

    def atribuir_checklist(self, cliente_id: int, modelo_id: int) -> ClienteDocumentacao:
        cliente = self._db.get(ClienteManual, cliente_id)
        if cliente is None:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        modelo = self._db.get(ChecklistModelo, modelo_id)
        if modelo is None:
            raise HTTPException(status_code=404, detail="Modelo de checklist não encontrado")
        itens = self._db.execute(select(ChecklistItem).where(ChecklistItem.modelo_id == modelo_id)).scalars().all()
        if not itens:
            raise HTTPException(status_code=400, detail="O modelo não tem itens. Adicione documentos no checklist.")

        doc = self._db.execute(
            select(ClienteDocumentacao).where(ClienteDocumentacao.cliente_manual_id == cliente_id),
        ).scalar_one_or_none()

        now = _utcnow()
        if doc is None:
            doc = ClienteDocumentacao(
                cliente_manual_id=cliente_id,
                modelo_id=modelo_id,
                token=secrets.token_urlsafe(32),
                created_at=now,
                updated_at=now,
            )
            self._db.add(doc)
            return doc

        if doc.modelo_id != modelo_id:
            for ent in list(doc.entregas):
                delete_entrega_file(ent.arquivo_path)
                self._db.delete(ent)
            doc.modelo_id = modelo_id
        doc.updated_at = now
        return doc

    def portal_link(self, cliente_id: int, base_origin: str, regenerar: bool = False) -> PortalLinkOut:
        doc = self._db.execute(
            select(ClienteDocumentacao).where(ClienteDocumentacao.cliente_manual_id == cliente_id),
        ).scalar_one_or_none()
        if doc is None:
            raise HTTPException(status_code=400, detail="Atribua um checklist ao cliente antes de gerar o link.")
        regen = False
        if regenerar:
            doc.token = secrets.token_urlsafe(32)
            doc.updated_at = _utcnow()
            regen = True
        return PortalLinkOut(
            token=doc.token,
            portal_url=build_portal_url(base_origin, doc.token),
            regenerado=regen,
        )

    def get_portal_publico(self, token: str) -> PortalPublicoOut:
        doc = self._db.execute(
            select(ClienteDocumentacao)
            .where(ClienteDocumentacao.token == token)
            .options(selectinload(ClienteDocumentacao.entregas)),
        ).scalar_one_or_none()
        if doc is None:
            raise HTTPException(status_code=404, detail="Link inválido ou expirado.")
        cliente = self._db.get(ClienteManual, doc.cliente_manual_id)
        primeiro_nome = (cliente.nome if cliente else "Contribuinte").strip().split()[0] if cliente else "Contribuinte"
        itens = list(
            self._db.execute(
                select(ChecklistItem).where(ChecklistItem.modelo_id == doc.modelo_id).order_by(ChecklistItem.ordem),
            ).scalars(),
        )
        _, _, pct = _calc_progress(itens, list(doc.entregas))
        return PortalPublicoOut(
            titulo_portal=f"Envio de documentos — {primeiro_nome}",
            percentual=pct,
            itens=_itens_out(itens, list(doc.entregas)),
            portal_bloqueado=bool(doc.portal_bloqueado),
        )

    async def upload_portal(self, token: str, checklist_item_id: int, file: UploadFile) -> DocumentoEntregaOut:
        doc = self._db.execute(
            select(ClienteDocumentacao)
            .where(ClienteDocumentacao.token == token)
            .options(selectinload(ClienteDocumentacao.entregas)),
        ).scalar_one_or_none()
        if doc is None:
            raise HTTPException(status_code=404, detail="Link inválido.")
        if doc.portal_bloqueado:
            raise HTTPException(
                status_code=403,
                detail="O envio de documentos está bloqueado pelo escritório. Não é possível alterar ou substituir ficheiros.",
            )
        item = self._db.execute(
            select(ChecklistItem).where(
                ChecklistItem.id == checklist_item_id,
                ChecklistItem.modelo_id == doc.modelo_id,
            ),
        ).scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=404, detail="Item do checklist não encontrado.")

        nome, path, size, ct = await save_upload(
            documentacao_id=doc.id,
            checklist_item_id=item.id,
            file=file,
        )
        now = _utcnow()
        existente = next((e for e in doc.entregas if e.checklist_item_id == item.id), None)
        if existente:
            delete_entrega_file(existente.arquivo_path)
            existente.arquivo_nome = nome
            existente.arquivo_path = path
            existente.content_type = ct
            existente.tamanho_bytes = size
            existente.uploaded_at = now
        else:
            self._db.add(
                ClienteDocumentoEntrega(
                    cliente_documentacao_id=doc.id,
                    checklist_item_id=item.id,
                    arquivo_nome=nome,
                    arquivo_path=path,
                    content_type=ct,
                    tamanho_bytes=size,
                    uploaded_at=now,
                ),
            )
        doc.updated_at = now
        return DocumentoEntregaOut(
            checklist_item_id=item.id,
            titulo=item.titulo,
            descricao=item.descricao,
            obrigatorio=item.obrigatorio,
            ordem=item.ordem,
            entregue=True,
            arquivo_nome=nome,
            uploaded_at=now,
        )
