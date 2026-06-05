from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cliente_manual import ClienteManual


class ClienteManualRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> list[ClienteManual]:
        return list(self._db.scalars(select(ClienteManual).order_by(ClienteManual.nome)).all())

    def list_by_ano_carteira(self, ano_carteira: int) -> list[ClienteManual]:
        q = (
            select(ClienteManual)
            .where(ClienteManual.ano_carteira == ano_carteira)
            .order_by(ClienteManual.nome)
        )
        return list(self._db.scalars(q).all())

    def get(self, cliente_id: int) -> ClienteManual | None:
        return self._db.get(ClienteManual, cliente_id)

    def add(self, row: ClienteManual) -> ClienteManual:
        self._db.add(row)
        return row

    def delete(self, row: ClienteManual) -> None:
        self._db.delete(row)
