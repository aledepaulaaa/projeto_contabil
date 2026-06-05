from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.precificacao import PrecificacaoParametrosOut, PrecificacaoParametrosUpdate
from app.services.precificacao_parametros_service import PrecificacaoParametrosService

router = APIRouter(prefix="/precificacao", tags=["precificacao"])


def _svc(db: Session) -> PrecificacaoParametrosService:
    return PrecificacaoParametrosService(db)


@router.get("/parametros", response_model=PrecificacaoParametrosOut)
def get_parametros(db: Session = Depends(get_db)) -> PrecificacaoParametrosOut:
    return _svc(db).get()


@router.put("/parametros", response_model=PrecificacaoParametrosOut)
def put_parametros(
    payload: PrecificacaoParametrosUpdate,
    db: Session = Depends(get_db),
) -> PrecificacaoParametrosOut:
    out = _svc(db).save(payload)
    db.commit()
    return out
