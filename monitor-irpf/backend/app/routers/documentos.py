from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.documentos import (
    AtribuirChecklistIn,
    ClienteDocumentacaoDetalheOut,
    DocumentoClienteRowOut,
    PortalBloqueioIn,
    PortalLinkOut,
)
from app.services.documentos_service import DocumentosService, build_portal_url

router = APIRouter(prefix="/documentos", tags=["documentos"])


def _origin(request: Request, x_frontend_origin: str | None) -> str:
    if x_frontend_origin and x_frontend_origin.strip():
        return x_frontend_origin.strip().rstrip("/")
    return str(request.base_url).rstrip("/")


def _svc(db: Session) -> DocumentosService:
    return DocumentosService(db)


@router.get("", response_model=list[DocumentoClienteRowOut])
def list_documentos(
    request: Request,
    ano: int = Query(..., description="Ano-calendário da carteira."),
    x_frontend_origin: str | None = Header(None, alias="X-Frontend-Origin"),
    db: Session = Depends(get_db),
) -> list[DocumentoClienteRowOut]:
    return _svc(db).list_clientes(ano, _origin(request, x_frontend_origin))


@router.get("/clientes/{cliente_id}", response_model=ClienteDocumentacaoDetalheOut)
def get_cliente_documentos(
    cliente_id: int,
    request: Request,
    x_frontend_origin: str | None = Header(None, alias="X-Frontend-Origin"),
    db: Session = Depends(get_db),
) -> ClienteDocumentacaoDetalheOut:
    out = _svc(db).get_cliente(cliente_id, _origin(request, x_frontend_origin))
    if out is None:
        raise HTTPException(status_code=404, detail="Cliente sem checklist atribuído.")
    return out


@router.patch("/clientes/{cliente_id}/portal-bloqueio")
def portal_bloqueio(
    cliente_id: int,
    payload: PortalBloqueioIn,
    db: Session = Depends(get_db),
) -> dict:
    doc = _svc(db).set_portal_bloqueado(cliente_id, payload.bloqueado)
    db.commit()
    return {"ok": True, "portal_bloqueado": bool(doc.portal_bloqueado)}


@router.get("/entregas/{entrega_id}/arquivo")
def download_entrega(entrega_id: int, db: Session = Depends(get_db)):
    path, nome, media = _svc(db).get_entrega_arquivo(entrega_id)
    suffix = Path(nome).suffix.lower()
    if not media:
        media = "application/pdf" if suffix == ".pdf" else "application/octet-stream"
    return FileResponse(path, filename=nome, media_type=media)


@router.put("/clientes/{cliente_id}/checklist")
def atribuir_checklist(
    cliente_id: int,
    payload: AtribuirChecklistIn,
    request: Request,
    x_frontend_origin: str | None = Header(None, alias="X-Frontend-Origin"),
    db: Session = Depends(get_db),
) -> dict:
    doc = _svc(db).atribuir_checklist(cliente_id, payload.modelo_id)
    db.commit()
    return {
        "ok": True,
        "documentacao_id": doc.id,
        "portal_url": build_portal_url(_origin(request, x_frontend_origin), doc.token),
    }


@router.post("/clientes/{cliente_id}/link", response_model=PortalLinkOut)
def gerar_link(
    cliente_id: int,
    request: Request,
    regenerar: bool = Query(False),
    x_frontend_origin: str | None = Header(None, alias="X-Frontend-Origin"),
    db: Session = Depends(get_db),
) -> PortalLinkOut:
    out = _svc(db).portal_link(cliente_id, _origin(request, x_frontend_origin), regenerar=regenerar)
    db.commit()
    return out
