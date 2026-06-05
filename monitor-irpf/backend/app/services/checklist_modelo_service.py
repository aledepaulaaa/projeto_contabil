from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.checklist import ChecklistItem, ChecklistModelo
from app.schemas.checklist import ChecklistItemIn, ChecklistModeloCreate, ChecklistModeloUpdate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ChecklistModeloService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_resumo(self) -> list[tuple[ChecklistModelo, int]]:
        rows = self._db.execute(
            select(ChecklistModelo, func.count(ChecklistItem.id))
            .outerjoin(ChecklistItem, ChecklistItem.modelo_id == ChecklistModelo.id)
            .group_by(ChecklistModelo.id)
            .order_by(ChecklistModelo.nome),
        ).all()
        return [(m, int(c or 0)) for m, c in rows]

    def get(self, modelo_id: int) -> ChecklistModelo | None:
        return self._db.execute(
            select(ChecklistModelo)
            .where(ChecklistModelo.id == modelo_id)
            .options(selectinload(ChecklistModelo.itens)),
        ).scalar_one_or_none()

    def create(self, payload: ChecklistModeloCreate) -> ChecklistModelo:
        now = _utcnow()
        row = ChecklistModelo(
            nome=payload.nome.strip(),
            descricao=(payload.descricao or "").strip() or None,
            created_at=now,
            updated_at=now,
        )
        self._db.add(row)
        self._db.flush()
        self._apply_itens(row, payload.itens)
        row.updated_at = _utcnow()
        return row

    def update(self, modelo_id: int, payload: ChecklistModeloUpdate) -> ChecklistModelo | None:
        row = self.get(modelo_id)
        if row is None:
            return None
        if payload.nome is not None:
            row.nome = payload.nome.strip()
        if payload.descricao is not None:
            row.descricao = (payload.descricao or "").strip() or None
        if payload.itens is not None:
            for item in list(row.itens):
                self._db.delete(item)
            self._db.flush()
            self._apply_itens(row, payload.itens)
        row.updated_at = _utcnow()
        return row

    def delete(self, modelo_id: int) -> bool:
        row = self._db.get(ChecklistModelo, modelo_id)
        if row is None:
            return False
        self._db.delete(row)
        return True

    def _apply_itens(self, modelo: ChecklistModelo, itens: list[ChecklistItemIn]) -> None:
        for idx, it in enumerate(itens):
            titulo = (it.titulo or "").strip()
            if not titulo:
                continue
            self._db.add(
                ChecklistItem(
                    modelo_id=modelo.id,
                    titulo=titulo,
                    descricao=(it.descricao or "").strip() or None,
                    ordem=it.ordem if it.ordem else idx,
                    obrigatorio=bool(it.obrigatorio),
                ),
            )
