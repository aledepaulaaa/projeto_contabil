import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.diagnostico_fiscal import (
    DiagnosticoFiscalAtualizarOut,
    DiagnosticoFiscalDetalheOut,
    DiagnosticoFiscalListaOut,
)
from app.services.diagnostico_fiscal_service import DiagnosticoFiscalService

router = APIRouter(prefix="/diagnostico-fiscal", tags=["diagnostico-fiscal"])


def _svc(db: Session) -> DiagnosticoFiscalService:
    return DiagnosticoFiscalService(db)


@router.get("", response_model=DiagnosticoFiscalListaOut)
def listar_diagnostico_fiscal(
    ano: int = Query(..., description="Ano-calendário"),
    db: Session = Depends(get_db),
):
    return _svc(db).listar(ano)


@router.get("/exportar-todos")
def exportar_todos_diagnosticos(
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    svc = _svc(db)
    lista = svc.listar(ano)
    pacote = []
    for item in lista.itens:
        pacote.append(
            {
                "cpf": item.cpf,
                "nome": item.nome,
                "situacao": item.situacao,
                "situacao_label": item.situacao_label,
                "consultado_em": item.consultado_em.isoformat() if item.consultado_em else None,
                "resultado": svc.resultado_bruto(ano, item.cpf),
            }
        )
    content = json.dumps(pacote, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="diagnosticos-ecac-{ano}.json"'},
    )


@router.post("/atualizar", response_model=DiagnosticoFiscalAtualizarOut)
async def atualizar_diagnostico_ano(
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    return await _svc(db).atualizar_ano(ano)


@router.get("/{cpf}/detalhes", response_model=DiagnosticoFiscalDetalheOut)
def detalhes_diagnostico_fiscal(
    cpf: str,
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        return _svc(db).detalhe(ano, cpf)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/{cpf}/download")
def download_diagnostico_fiscal(
    cpf: str,
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    data = _svc(db).resultado_bruto(ano, cpf)
    if data is None:
        raise HTTPException(status_code=404, detail="Diagnóstico não encontrado para download.")
    content = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="diagnostico-{cpf}-{ano}.json"'},
    )


@router.post("/{cpf}/atualizar", response_model=DiagnosticoFiscalAtualizarOut)
async def atualizar_diagnostico_cpf(
    cpf: str,
    ano: int = Query(...),
    db: Session = Depends(get_db),
):
    try:
        return await _svc(db).atualizar_cpf(ano, cpf)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
