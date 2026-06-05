from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ClienteCarteiraEstado(Base):
    """Estado (ativo/inativo) para contribuintes identificados só pelas declarações (chave cpf: ou nome:)."""

    __tablename__ = "cliente_carteira_estados"

    carteira_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
