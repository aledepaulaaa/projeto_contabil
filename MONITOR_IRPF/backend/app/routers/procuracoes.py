from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.procuracao import CarteiraDeclaracaoSituacaoRow
from app.services.cliente_service import ClienteService

router = APIRouter(prefix="/procuracoes", tags=["procuracoes"])


@router.get("/carteira-situacao-declaracoes", response_model=list[CarteiraDeclaracaoSituacaoRow])
def carteira_situacao_declaracoes(
    ano: int = Query(..., description="Ano-calendário IRPF (exercício da carteira)."),
    db: Session = Depends(get_db),
) -> list[CarteiraDeclaracaoSituacaoRow]:
    return ClienteService(db).list_carteira_declaracao_situacao(ano)
