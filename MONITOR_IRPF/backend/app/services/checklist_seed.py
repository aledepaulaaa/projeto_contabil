from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.checklist import ChecklistItem, ChecklistModelo


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def ensure_checklist_padrao(db: Session) -> None:
    """Cria um modelo inicial se não existir nenhum."""
    existe = db.execute(select(ChecklistModelo.id).limit(1)).scalar_one_or_none()
    if existe is not None:
        return
    now = _utcnow()
    modelo = ChecklistModelo(
        nome="Documentos IRPF — padrão",
        descricao="Lista inicial para recolha de documentos da declaração.",
        created_at=now,
        updated_at=now,
    )
    db.add(modelo)
    db.flush()
    itens = [
        ("Informe de rendimentos (empregador/bancos)", True),
        ("Comprovantes de despesas médicas", True),
        ("Comprovantes de despesas com educação", False),
        ("Extratos e informes de investimentos", False),
        ("Comprovante de pagamentos dedutíveis (PGBL, etc.)", False),
        ("Documentos de bens e direitos (imóveis, veículos)", False),
        ("Outros documentos relevantes", False),
    ]
    for ordem, (titulo, obr) in enumerate(itens):
        db.add(
            ChecklistItem(
                modelo_id=modelo.id,
                titulo=titulo,
                descricao=None,
                ordem=ordem,
                obrigatorio=obr,
            ),
        )
    db.flush()
