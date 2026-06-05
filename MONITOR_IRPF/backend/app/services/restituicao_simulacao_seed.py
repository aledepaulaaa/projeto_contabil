"""Declarações de demonstração com restituição — fase de testes."""

from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao
from app.services.restituicao_status import (
    STATUS_A_RESTITUIR,
    STATUS_ERRO_CREDITO,
    STATUS_PENDENTE,
    STATUS_RESTITUIDO,
)

# prefixo nome → (status, campos opcionais)
_DEMO: list[tuple[str, str, dict]] = [
    (
        "GEOVANA RIBEIRO",
        STATUS_RESTITUIDO,
        {
            "restituicao_paga": True,
            "data_pagamento_restituicao": date(2026, 6, 12),
            "status_processamento_rfb": "processada",
            "indicacao_malha_fina": False,
        },
    ),
    (
        "FERNANDA FERNANDES",
        STATUS_A_RESTITUIR,
        {
            "status_processamento_rfb": "fila_restituicao",
            "indicacao_malha_fina": False,
            "restituicao_paga": False,
        },
    ),
    (
        "GABRIEL DE PAIVA",
        STATUS_PENDENTE,
        {
            "status_processamento_rfb": "pendencia_malha",
            "indicacao_malha_fina": True,
            "malha_motivo_rfb": "Restituicao suspensa: declaracao retida em malha fina (simulacao).",
        },
    ),
    (
        "DIOGO PENA",
        STATUS_ERRO_CREDITO,
        {
            "status_processamento_rfb": "processada",
            "restituicao_erro_motivo": (
                "Credito em conta recusado pelo banco (cod. BC-REST-09): "
                "conta informada encerrada ou titularidade divergente do CPF."
            ),
            "restituicao_paga": False,
        },
    ),
]


def aplicar_restituicao_simulacao(db: Session, ano_calendario: int = 2025) -> int:
    rows = (
        db.query(Declaracao)
        .filter(
            Declaracao.ano_calendario == ano_calendario,
            Declaracao.resultado_fiscal == "restituir",
        )
        .all()
    )
    alterados = 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for row in rows:
        nome = (row.titular_nome or "").upper()
        perfil = next(
            ((status, extras) for prefix, status, extras in _DEMO if nome.startswith(prefix)),
            None,
        )
        if perfil is None:
            continue
        status, extras = perfil
        mudou = False
        if row.status != "entregue":
            row.status = "entregue"
            mudou = True
        if not row.data_entrega:
            row.data_entrega = date(ano_calendario + 1, 5, 15)
            mudou = True
        if not row.numero_recibo:
            row.numero_recibo = f"REC-REST-{row.id:06d}"
            mudou = True
        if row.restituicao_status != status:
            row.restituicao_status = status
            mudou = True
        for k, v in extras.items():
            if getattr(row, k) != v:
                setattr(row, k, v)
                mudou = True
        if not row.restituicao_fonte_consulta:
            row.restituicao_fonte_consulta = "simulacao"
            mudou = True
        if not row.restituicao_consultado_em:
            row.restituicao_consultado_em = now
            mudou = True
        if mudou:
            alterados += 1
    if alterados:
        db.commit()
    return alterados
