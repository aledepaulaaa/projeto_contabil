from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario


class UsuarioRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> Sequence[Usuario]:
        return self._db.scalars(select(Usuario).order_by(Usuario.id)).all()

    def get(self, usuario_id: int) -> Usuario | None:
        return self._db.get(Usuario, usuario_id)

    def add(self, row: Usuario) -> Usuario:
        self._db.add(row)
        self._db.flush()
        return row

    def delete(self, row: Usuario) -> None:
        self._db.delete(row)
