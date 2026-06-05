from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# manual | importacao_ano_anterior | sinc_declaracoes
ORIGEM_MANUAL = "manual"
ORIGEM_IMPORTACAO = "importacao_ano_anterior"
ORIGEM_SINC = "sinc_declaracoes"

# Tipo de precificação por cliente (valores base em app_kv / Preferências).
TIPO_PRECIFICACAO_PADRAO = "padrao"
TIPO_PRECIFICACAO_MINIMO = "minimo"
TIPO_PRECIFICACAO_MAXIMO = "maximo"
TIPO_PRECIFICACAO_PERSONALIZADO = "personalizado"
TIPO_PRECIFICACAO_BONIFICADO = "bonificado"
TIPOS_PRECIFICACAO_CLIENTE = frozenset({
    TIPO_PRECIFICACAO_PADRAO,
    TIPO_PRECIFICACAO_MINIMO,
    TIPO_PRECIFICACAO_MAXIMO,
    TIPO_PRECIFICACAO_PERSONALIZADO,
    TIPO_PRECIFICACAO_BONIFICADO,
})
"""Tipos permitidos como padrão em sinc./import. (não «personalizado»)."""
TIPOS_COBRANCA_PADRAO_IMPORTACAO = frozenset({
    TIPO_PRECIFICACAO_PADRAO,
    TIPO_PRECIFICACAO_MINIMO,
    TIPO_PRECIFICACAO_MAXIMO,
    TIPO_PRECIFICACAO_BONIFICADO,
})


class ClienteManual(Base):
    """Cliente na carteira por exercício (manual, importado ou sincronizado com declarações no BD)."""

    __tablename__ = "clientes_manuais"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano_carteira: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    origem_cadastro: Mapped[str] = mapped_column(String(32), nullable=False, default=ORIGEM_MANUAL, server_default="manual")
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cpf: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    telefone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_precificacao: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default=TIPO_PRECIFICACAO_PADRAO,
        server_default=TIPO_PRECIFICACAO_PADRAO,
    )
    valor_personalizado: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    asaas_customer_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
