from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Declaracao(Base):
    __tablename__ = "declaracoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano_calendario: Mapped[int] = mapped_column(Integer, nullable=False)
    titular_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    titular_cpf: Mapped[str | None] = mapped_column(String(14))
    status: Mapped[str] = mapped_column(String(9), nullable=False)
    data_entrega: Mapped[date | None] = mapped_column(Date)
    numero_recibo: Mapped[str | None] = mapped_column(String(64))
    caminho_arquivo_declaracao: Mapped[str | None] = mapped_column(String(1024))
    caminho_arquivo_recibo: Mapped[str | None] = mapped_column(String(1024))
    evolucao_patrimonial_resumo: Mapped[str | None] = mapped_column(Text)
    rendimentos_tributaveis_total: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    rendimentos_isentos_total: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    patrimonio_liquido_declarado: Mapped[Decimal | None] = mapped_column(Numeric(16, 2))
    resultado_fiscal: Mapped[str | None] = mapped_column(String(13))
    valor_imposto_ou_restituicao: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    imposto_quantidade_parcelas: Mapped[int | None] = mapped_column(Integer)
    imposto_debito_automatico: Mapped[bool | None] = mapped_column(Boolean)
    restituicao_paga: Mapped[bool | None] = mapped_column(Boolean)
    data_pagamento_restituicao: Mapped[date | None] = mapped_column(Date)
    restituicao_status: Mapped[str | None] = mapped_column(String(24))
    restituicao_erro_motivo: Mapped[str | None] = mapped_column(Text)
    restituicao_observacao: Mapped[str | None] = mapped_column(Text)
    restituicao_consultado_em: Mapped[datetime | None] = mapped_column(DateTime)
    restituicao_fonte_consulta: Mapped[str | None] = mapped_column(String(16))
    indicacao_malha_fina: Mapped[bool | None] = mapped_column(Boolean)
    malha_motivo_rfb: Mapped[str | None] = mapped_column(Text)
    malha_consultado_em: Mapped[datetime | None] = mapped_column(DateTime)
    malha_fonte_consulta: Mapped[str | None] = mapped_column(String(16))
    observacoes_monitoramento: Mapped[str | None] = mapped_column(Text)
    observacoes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    usuario_responsavel_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuarios.id"))
    status_processamento_rfb: Mapped[str | None] = mapped_column(String(32))

    usuario = relationship("Usuario", back_populates="declaracoes")
