from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.declaracao import Declaracao
from app.schemas.darf import DarfGerarIn, DarfListaOut
from app.services.darf_pdf import build_darf_test_pdf
from app.services.darf_service import DarfService

router = APIRouter(prefix="/darf", tags=["darf"])


def _svc(db: Session) -> DarfService:
    return DarfService(db)


@router.get("", response_model=DarfListaOut)
def listar_darf(
    ano: int = Query(..., description="Ano-calendário da declaração"),
    db: Session = Depends(get_db),
):
    return _svc(db).listar_imposto_pagar(ano)


@router.post("/{declaracao_id}/gerar")
def gerar_darf(
    declaracao_id: int,
    payload: DarfGerarIn,
    db: Session = Depends(get_db),
):
    row = db.get(Declaracao, declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    try:
        out = _svc(db).gerar(row, payload.parcela, payload.confirmar_debito_automatico)
        pdf_bytes, filename = build_darf_test_pdf(out)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
