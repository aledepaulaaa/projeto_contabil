from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


def _svc(db: Session) -> UsuarioService:
    return UsuarioService(db)


@router.get("", response_model=list[UsuarioOut])
def list_usuarios(db: Session = Depends(get_db)):
    rows = _svc(db).list_usuarios()
    return [UsuarioOut.model_validate(r) for r in rows]


@router.post("", response_model=UsuarioOut)
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    row = _svc(db).create(payload)
    db.commit()
    db.refresh(row)
    return UsuarioOut.model_validate(row)


@router.delete("/{usuario_id}", status_code=204)
def delete_usuario(usuario_id: int, db: Session = Depends(get_db)):
    svc = _svc(db)
    row = svc.get(usuario_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    svc.delete(row)
    db.commit()
    return None
