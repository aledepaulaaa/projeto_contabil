from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.declaracao import Declaracao
from app.schemas.malha import MalhaAtualizarOut, MalhaDetalheOut, MalhaListaOut
from app.services.malha_service import MalhaService

router = APIRouter(prefix="/malha", tags=["malha"])


def _svc(db: Session) -> MalhaService:
    return MalhaService(db)


@router.get("", response_model=MalhaListaOut)
def listar_malha(
    ano: int = Query(..., description="Ano-calendário da declaração"),
    db: Session = Depends(get_db),
):
    return _svc(db).listar_em_malha(ano)


@router.get("/{declaracao_id}/detalhes", response_model=MalhaDetalheOut)
def detalhes_malha(declaracao_id: int, db: Session = Depends(get_db)):
    row = db.get(Declaracao, declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    if not row.indicacao_malha_fina:
        raise HTTPException(status_code=404, detail="Declaração não está retida em malha.")
    return _svc(db).detalhe(row)


@router.post("/atualizar", response_model=MalhaAtualizarOut)
def atualizar_malha_ano(
    ano: int = Query(..., description="Ano-calendário"),
    db: Session = Depends(get_db),
):
    return _svc(db).atualizar_ano(ano)


@router.post("/{declaracao_id}/atualizar", response_model=MalhaAtualizarOut)
def atualizar_malha_declaracao(declaracao_id: int, db: Session = Depends(get_db)):
    row = db.get(Declaracao, declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    try:
        return _svc(db).atualizar_declaracao(row)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
