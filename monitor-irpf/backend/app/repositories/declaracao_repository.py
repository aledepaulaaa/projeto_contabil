from collections.abc import Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.declaracao import Declaracao


class DeclaracaoRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def _filtered(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> Select:
        q = select(Declaracao)
        if status:
            q = q.where(Declaracao.status == status)
        if ano is not None:
            q = q.where(Declaracao.ano_calendario == ano)
        if usuario_responsavel_id is not None:
            q = q.where(Declaracao.usuario_responsavel_id == usuario_responsavel_id)
        if status_processamento_rfb:
            q = q.where(Declaracao.status_processamento_rfb == status_processamento_rfb)
        return q

    def list_all(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> Sequence[Declaracao]:
        q = self._filtered(status, ano, usuario_responsavel_id, status_processamento_rfb).order_by(
            Declaracao.id.desc(),
        )
        return self._db.scalars(q).all()

    def get(self, declaracao_id: int) -> Declaracao | None:
        return self._db.get(Declaracao, declaracao_id)

    def delete(self, row: Declaracao) -> None:
        self._db.delete(row)

    def add(self, row: Declaracao) -> Declaracao:
        self._db.add(row)
        self._db.flush()
        return row

    def por_status_counts(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> list[tuple[str, int]]:
        q = select(Declaracao.status, func.count()).group_by(Declaracao.status)
        if status:
            q = q.where(Declaracao.status == status)
        if ano is not None:
            q = q.where(Declaracao.ano_calendario == ano)
        if usuario_responsavel_id is not None:
            q = q.where(Declaracao.usuario_responsavel_id == usuario_responsavel_id)
        if status_processamento_rfb:
            q = q.where(Declaracao.status_processamento_rfb == status_processamento_rfb)
        return list(self._db.execute(q).all())

    def por_resultado_counts(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> list[tuple[str | None, int]]:
        q = select(Declaracao.resultado_fiscal, func.count()).group_by(Declaracao.resultado_fiscal)
        if status:
            q = q.where(Declaracao.status == status)
        if ano is not None:
            q = q.where(Declaracao.ano_calendario == ano)
        if usuario_responsavel_id is not None:
            q = q.where(Declaracao.usuario_responsavel_id == usuario_responsavel_id)
        if status_processamento_rfb:
            q = q.where(Declaracao.status_processamento_rfb == status_processamento_rfb)
        return list(self._db.execute(q).all())

    def por_ano_counts(
        self,
        status: str | None,
        ano: int | None,
        usuario_responsavel_id: int | None = None,
        status_processamento_rfb: str | None = None,
    ) -> list[tuple[int, int]]:
        q = select(Declaracao.ano_calendario, func.count()).group_by(Declaracao.ano_calendario)
        if status:
            q = q.where(Declaracao.status == status)
        if ano is not None:
            q = q.where(Declaracao.ano_calendario == ano)
        if usuario_responsavel_id is not None:
            q = q.where(Declaracao.usuario_responsavel_id == usuario_responsavel_id)
        if status_processamento_rfb:
            q = q.where(Declaracao.status_processamento_rfb == status_processamento_rfb)
        q = q.order_by(Declaracao.ano_calendario.desc())
        return list(self._db.execute(q).all())
