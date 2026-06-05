from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Cobranca(Base):
    __tablename__ = "cobrancas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    declaracao_id: Mapped[int] = mapped_column(Integer, ForeignKey("declaracoes.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    external_payment_id: Mapped[str] = mapped_column(String(64), nullable=False)
    external_customer_id: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    invoice_url: Mapped[str | None] = mapped_column(String(1024))
    bank_slip_url: Mapped[str | None] = mapped_column(String(1024))
    raw_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
