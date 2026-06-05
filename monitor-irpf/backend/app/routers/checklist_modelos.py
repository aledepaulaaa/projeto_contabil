from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.checklist import (
    ChecklistModeloCreate,
    ChecklistModeloOut,
    ChecklistModeloResumoOut,
    ChecklistModeloUpdate,
)
from app.services.checklist_modelo_service import ChecklistModeloService

router = APIRouter(prefix="/checklist-modelos", tags=["checklist-modelos"])


def _svc(db: Session) -> ChecklistModeloService:
    return ChecklistModeloService(db)


@router.get("", response_model=list[ChecklistModeloResumoOut])
def list_modelos(db: Session = Depends(get_db)) -> list[ChecklistModeloResumoOut]:
    return [
        ChecklistModeloResumoOut(id=m.id, nome=m.nome, itens_count=count)
        for m, count in _svc(db).list_resumo()
    ]


@router.get("/{modelo_id}", response_model=ChecklistModeloOut)
def get_modelo(modelo_id: int, db: Session = Depends(get_db)) -> ChecklistModeloOut:
    row = _svc(db).get(modelo_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    return ChecklistModeloOut.model_validate(row)


@router.post("", response_model=ChecklistModeloOut)
def create_modelo(payload: ChecklistModeloCreate, db: Session = Depends(get_db)) -> ChecklistModeloOut:
    row = _svc(db).create(payload)
    db.commit()
    db.refresh(row)
    loaded = _svc(db).get(row.id)
    return ChecklistModeloOut.model_validate(loaded)


@router.put("/{modelo_id}", response_model=ChecklistModeloOut)
def update_modelo(
    modelo_id: int,
    payload: ChecklistModeloUpdate,
    db: Session = Depends(get_db),
) -> ChecklistModeloOut:
    row = _svc(db).update(modelo_id, payload)
    if row is None:
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    db.commit()
    loaded = _svc(db).get(modelo_id)
    return ChecklistModeloOut.model_validate(loaded)


@router.delete("/{modelo_id}")
def delete_modelo(modelo_id: int, db: Session = Depends(get_db)) -> dict:
    if not _svc(db).delete(modelo_id):
        raise HTTPException(status_code=404, detail="Modelo não encontrado")
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Não foi possível apagar: o modelo pode estar atribuído a clientes.",
        ) from e
    return {"ok": True}
