from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.declaracao import DeclaracaoCreate, DeclaracaoOut, DeclaracaoUpdate
from app.services.declaracao_service import DeclaracaoService
from app.services.monitor_scan_service import MonitorScanService

router = APIRouter(prefix="/declaracoes", tags=["declaracoes"])


def _svc(db: Session) -> DeclaracaoService:
    return DeclaracaoService(db)


@router.get("", response_model=list[DeclaracaoOut])
def list_declaracoes(
    status: str | None = Query(None),
    ano: int | None = Query(None),
    usuario_responsavel_id: int | None = Query(None),
    status_processamento_rfb: str | None = Query(None),
    db: Session = Depends(get_db),
):
    rows = _svc(db).list_declaracoes(status, ano, usuario_responsavel_id, status_processamento_rfb)
    return [DeclaracaoOut.model_validate(r) for r in rows]


@router.get("/dashboard-resumo")
def dashboard_resumo(
    status: str | None = Query(None),
    ano: int | None = Query(None),
    usuario_responsavel_id: int | None = Query(None),
    status_processamento_rfb: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return _svc(db).dashboard_resumo(status, ano, usuario_responsavel_id, status_processamento_rfb).model_dump()


@router.post("", response_model=DeclaracaoOut)
def create_declaracao(payload: DeclaracaoCreate, db: Session = Depends(get_db)):
    row = _svc(db).create(payload)
    db.commit()
    db.refresh(row)
    return DeclaracaoOut.model_validate(row)


@router.patch("/{declaracao_id}", response_model=DeclaracaoOut)
def patch_declaracao(declaracao_id: int, payload: DeclaracaoUpdate, db: Session = Depends(get_db)):
    svc = _svc(db)
    row = svc.get(declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    svc.update(row, payload)
    db.commit()
    db.refresh(row)
    return DeclaracaoOut.model_validate(row)


@router.delete("/{declaracao_id}", status_code=204)
def delete_declaracao(declaracao_id: int, db: Session = Depends(get_db)):
    svc = _svc(db)
    row = svc.get(declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    svc.delete(row)
    db.commit()
    return None


@router.post("/sincronizar-pasta-irpf")
def sincronizar_pasta_irpf(db: Session = Depends(get_db)) -> dict:
    return MonitorScanService.sincronizar(db)


@router.post("/{declaracao_id}/abrir-local")
def abrir_local(declaracao_id: int, tipo: str = Query(...), db: Session = Depends(get_db)) -> dict:
    row = _svc(db).get(declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    return {"ok": True, "declaracao_id": declaracao_id, "tipo": tipo}


@router.get("/{declaracao_id}/pdf-resumo")
def pdf_resumo(declaracao_id: int, tipo: str = Query(...), db: Session = Depends(get_db)):
    row = _svc(db).get(declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    path_str = row.caminho_arquivo_recibo if tipo.lower() == "recibo" else row.caminho_arquivo_declaracao
    if not path_str:
        raise HTTPException(status_code=404, detail="Arquivo não configurado para esta declaração")
    path = Path(path_str)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no disco")
    suffix = path.suffix.lower()
    media = "application/pdf" if suffix == ".pdf" else "application/octet-stream"
    return FileResponse(path, filename=path.name, media_type=media)


@router.post("/{declaracao_id}/extrair-resultado")
def extrair_resultado(
    declaracao_id: int,
    caminho_arquivo: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    row = _svc(db).get(declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    return {
        "ok": True,
        "declaracao_id": declaracao_id,
        "caminho_usado": caminho_arquivo,
        "message": "Extração XML/PDF não reimplementada nesta versão reconstruída.",
    }


