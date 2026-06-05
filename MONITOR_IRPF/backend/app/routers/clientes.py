from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.cliente import (
    ClienteImportarAnoIn,
    ClienteImportarAnoOut,
    ClienteListRowOut,
    ClienteManualCreate,
    ClienteManualOut,
    ClienteManualUpdate,
    ClienteSincronizarDeclOut,
    ClienteToggleAtivoIn,
)
from app.services.cliente_service import ClienteService

router = APIRouter(prefix="/clientes", tags=["clientes"])


def _svc(db: Session) -> ClienteService:
    return ClienteService(db)


@router.get("", response_model=list[ClienteListRowOut])
def list_clientes(
    ano: int = Query(..., description="Ano-calendário da carteira (exercício)."),
    db: Session = Depends(get_db),
) -> list[ClienteListRowOut]:
    return _svc(db).list_carteira_exercicio(ano)


@router.post("/sincronizar-declaracoes", response_model=ClienteSincronizarDeclOut)
def sincronizar_declaracoes(
    ano: int = Query(..., description="Ano-calendário das declarações no banco a espelhar na carteira."),
    db: Session = Depends(get_db),
) -> ClienteSincronizarDeclOut:
    out = _svc(db).sincronizar_declaracoes_banco(ano)
    db.commit()
    return out


@router.post("/toggle-ativo")
def toggle_ativo(payload: ClienteToggleAtivoIn, db: Session = Depends(get_db)) -> dict:
    try:
        _svc(db).set_ativo(payload.estado_key, payload.ativo, payload.ano_calendario)
        db.commit()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"ok": True}


@router.post("/importar-do-ano", response_model=ClienteImportarAnoOut)
def importar_do_ano(payload: ClienteImportarAnoIn, db: Session = Depends(get_db)) -> ClienteImportarAnoOut:
    out = _svc(db).importar_do_ano_anterior(payload.ano_origem, payload.ano_destino)
    db.commit()
    return out


@router.post("/manuais", response_model=ClienteManualOut)
def create_manual(payload: ClienteManualCreate, db: Session = Depends(get_db)) -> ClienteManualOut:
    svc = _svc(db)
    try:
        row = svc.create_manual(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    db.commit()
    db.refresh(row)
    return ClienteManualOut.model_validate(row)


@router.patch("/manuais/{cliente_id}", response_model=ClienteManualOut)
def update_manual(
    cliente_id: int,
    payload: ClienteManualUpdate,
    db: Session = Depends(get_db),
) -> ClienteManualOut:
    svc = _svc(db)
    row = svc.get_manual(cliente_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    try:
        svc.update_manual(row, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    db.commit()
    db.refresh(row)
    return ClienteManualOut.model_validate(row)


@router.delete("/manuais/{cliente_id}", status_code=204)
def delete_manual(
    cliente_id: int,
    ano_calendario: int = Query(..., description="Exercício da carteira para validar declaração/procuração."),
    db: Session = Depends(get_db),
) -> None:
    svc = _svc(db)
    row = svc.get_manual(cliente_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    try:
        svc.ensure_exclusao_permitida(row, ano_calendario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    svc.delete_manual(row)
    db.commit()
