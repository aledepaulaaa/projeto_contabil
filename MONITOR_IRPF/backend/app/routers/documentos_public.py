from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.documentos import DocumentoEntregaOut, PortalPublicoOut
from app.services.documentos_service import DocumentosService

router = APIRouter(prefix="/public/documentos", tags=["documentos-public"])


def _svc(db: Session) -> DocumentosService:
    return DocumentosService(db)


@router.get("/{token}", response_model=PortalPublicoOut)
def portal_get(token: str, db: Session = Depends(get_db)) -> PortalPublicoOut:
    return _svc(db).get_portal_publico(token)


@router.post("/{token}/upload", response_model=DocumentoEntregaOut)
async def portal_upload(
    token: str,
    checklist_item_id: int = Form(...),
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentoEntregaOut:
    out = await _svc(db).upload_portal(token, checklist_item_id, arquivo)
    db.commit()
    return out
