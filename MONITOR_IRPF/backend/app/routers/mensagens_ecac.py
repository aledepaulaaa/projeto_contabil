import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.mensagens_ecac import (
    MensagensEcacAtualizarOut,
    MensagensEcacCaixaOut,
    MensagensEcacListaOut,
    MensagensEcacPontuaisIn,
)
from app.services.mensagens_ecac_service import MensagensEcacService

router = APIRouter(prefix="/mensagens-ecac", tags=["mensagens-ecac"])


def _svc(db: Session) -> MensagensEcacService:
    return MensagensEcacService(db)


@router.get("", response_model=MensagensEcacListaOut)
def listar_mensagens_ecac(
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    return _svc(db).listar(ano)


@router.post("/consultar-lote", response_model=MensagensEcacAtualizarOut)
async def consultar_lote(
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    return await _svc(db).consultar_lote(ano)


@router.post("/pontuais", response_model=MensagensEcacAtualizarOut)
async def consultar_pontuais(
    payload: MensagensEcacPontuaisIn,
    db: Session = Depends(get_db),
):
    try:
        return await _svc(db).consultar_cpf(payload.ano_calendario, payload.cpf)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/exportar-todos")
def exportar_todos(ano: int = Query(...), db: Session = Depends(get_db)):
    svc = _svc(db)
    lista = svc.listar(ano)
    pacote = []
    for item in lista.itens:
        try:
            caixa = svc.caixa(ano, item.cpf, marcar_lidas=False)
            pacote.append(caixa.model_dump())
        except ValueError:
            pacote.append({"cpf": item.cpf, "nome": item.nome, "mensagens": []})
    content = json.dumps(pacote, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="mensagens-ecac-{ano}.json"'},
    )


@router.get("/{cpf}/caixa", response_model=MensagensEcacCaixaOut)
def abrir_caixa(
    cpf: str,
    ano: int = Query(...),
    marcar_lidas: bool = Query(False),
    db: Session = Depends(get_db),
):
    try:
        return _svc(db).caixa(ano, cpf, marcar_lidas=marcar_lidas)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post("/{cpf}/consultar", response_model=MensagensEcacAtualizarOut)
async def consultar_cpf(
    cpf: str,
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        return await _svc(db).consultar_cpf(ano, cpf)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
