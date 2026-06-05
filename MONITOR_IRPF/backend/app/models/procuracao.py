from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Procuracao(Base):
    """Procuração vinculada a um contribuinte e ano-calendário (base para bloqueios de exclusão/inativação)."""

    __tablename__ = "procuracoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano_calendario: Mapped[int] = mapped_column(Integer, nullable=False)
    titular_cpf: Mapped[str | None] = mapped_column(String(20), nullable=True)
    titular_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
