"""Declarações de demonstração retidas em malha fina — fase de testes."""

from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao

_DEMO_MALHA: list[tuple[str, str]] = [
    (
        "ANA FLAVIA OLIVEIRA",
        "Divergencia em rendimentos tributaveis: valores declarados inferiores aos informados "
        "por fontes pagadoras na DIRF (cod. pendencia RF-RT-014).",
    ),
    (
        "ANA LUIZA DE OLIVEIRA",
        "Despesas medicas deduzidas sem lastro aceito na base da Receita Federal "
        "(inconsistencia em eSocial / prestadores — cod. RF-DM-022).",
    ),
    (
        "DIEGO MARTINS DE SOUSA",
        "Bens e direitos: valor de aquisicao declarado incompativel com a evolucao patrimonial "
        "da declaracao do exercicio anterior (cod. RF-BD-031).",
    ),
]


def aplicar_malha_simulacao(db: Session, ano_calendario: int = 2025) -> int:
    rows = (
        db.query(Declaracao)
        .filter(Declaracao.ano_calendario == ano_calendario)
        .all()
    )
    alterados = 0
    for row in rows:
        nome = (row.titular_nome or "").upper()
        motivo = next((m for prefix, m in _DEMO_MALHA if nome.startswith(prefix)), None)
        if motivo is None:
            continue
        mudou = False
        if row.status != "entregue":
            row.status = "entregue"
            mudou = True
        if not row.data_entrega:
            row.data_entrega = date(ano_calendario + 1, 4, 30)
            mudou = True
        if not row.numero_recibo:
            row.numero_recibo = f"REC-MALHA-{row.id:06d}"
            mudou = True
        if not row.indicacao_malha_fina:
            row.indicacao_malha_fina = True
            mudou = True
        if row.status_processamento_rfb != "pendencia_malha":
            row.status_processamento_rfb = "pendencia_malha"
            mudou = True
        if row.malha_motivo_rfb != motivo:
            row.malha_motivo_rfb = motivo
            mudou = True
        if not row.malha_fonte_consulta:
            row.malha_fonte_consulta = "simulacao"
            mudou = True
        if not row.malha_consultado_em:
            row.malha_consultado_em = datetime.now(timezone.utc).replace(tzinfo=None)
            mudou = True
        if mudou:
            alterados += 1
    if alterados:
        db.commit()
    return alterados
