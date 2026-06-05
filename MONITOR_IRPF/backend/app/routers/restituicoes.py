from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.declaracao import Declaracao
from app.schemas.restituicoes import RestituicaoAtualizarOut, RestituicaoDetalheOut, RestituicaoListaOut
from app.services.restituicao_service import RestituicaoService

router = APIRouter(prefix="/restituicoes", tags=["restituicoes"])


def _svc(db: Session) -> RestituicaoService:
    return RestituicaoService(db)


@router.get("", response_model=RestituicaoListaOut)
def listar_restituicoes(
    ano: int = Query(..., description="Ano-calendário da declaração"),
    db: Session = Depends(get_db),
):
    return _svc(db).listar(ano)


@router.get("/{declaracao_id}/detalhes", response_model=RestituicaoDetalheOut)
def detalhes_restituicao(declaracao_id: int, db: Session = Depends(get_db)):
    row = db.get(Declaracao, declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    if row.status != "entregue" or row.resultado_fiscal != "restituir":
        raise HTTPException(status_code=404, detail="Declaração não é restituição entregue.")
    return _svc(db).detalhe(row)


@router.post("/atualizar", response_model=RestituicaoAtualizarOut)
def atualizar_restituicoes_ano(
    ano: int = Query(..., description="Ano-calendário"),
    db: Session = Depends(get_db),
):
    return _svc(db).atualizar_ano(ano)


@router.post("/{declaracao_id}/atualizar", response_model=RestituicaoAtualizarOut)
def atualizar_restituicao_declaracao(declaracao_id: int, db: Session = Depends(get_db)):
    row = db.get(Declaracao, declaracao_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Declaração não encontrada")
    try:
        return _svc(db).atualizar_declaracao(row)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
