import re
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.declaracao import Declaracao
from app.services.insights_relatorio_service import montar_relatorio_contribuinte

router = APIRouter(prefix="/insights", tags=["insights"])


def _digits(cpf: str) -> str:
    return re.sub(r"\D", "", cpf or "")


@router.get("/contribuinte")
def contribuinte(cpf: str = Query(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    d = _digits(cpf)
    if len(d) != 11:
        return {"cpf": cpf, "valido": False, "declaracoes": [], "message": "CPF inválido"}
    rows = db.scalars(select(Declaracao).where(Declaracao.titular_cpf.isnot(None))).all()
    rows = [r for r in rows if _digits(r.titular_cpf or "") == d]
    return {
        "cpf": cpf,
        "valido": True,
        "declaracoes": [
            {
                "id": r.id,
                "ano_calendario": r.ano_calendario,
                "titular_nome": r.titular_nome,
                "titular_cpf": r.titular_cpf,
                "status": r.status,
                "resultado_fiscal": r.resultado_fiscal,
            }
            for r in rows
        ],
    }


@router.get("/relatorio")
def relatorio_completo(cpf: str = Query(...), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Relatório de insights agregado por CPF (declarações gravadas na base)."""
    return montar_relatorio_contribuinte(db, cpf)
