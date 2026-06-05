from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario import UsuarioCreate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class UsuarioService:
    def __init__(self, db: Session) -> None:
        self._db = db
        self._repo = UsuarioRepository(db)

    def list_usuarios(self):
        return self._repo.list_all()

    def get(self, usuario_id: int) -> Usuario | None:
        return self._repo.get(usuario_id)

    def create(self, payload: UsuarioCreate) -> Usuario:
        now = _utcnow()
        row = Usuario(
            nome=payload.nome,
            email=payload.email,
            ativo=payload.ativo,
            created_at=now,
            updated_at=now,
        )
        self._repo.add(row)
        return row

    def delete(self, row: Usuario) -> None:
        self._repo.delete(row)
