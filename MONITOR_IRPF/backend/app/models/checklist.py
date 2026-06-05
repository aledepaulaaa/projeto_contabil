from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChecklistModelo(Base):
    """Modelo reutilizável de checklist de documentos (Configurações)."""

    __tablename__ = "checklist_modelos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    itens: Mapped[list["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="modelo",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.ordem",
    )


class ChecklistItem(Base):
    __tablename__ = "checklist_itens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    modelo_id: Mapped[int] = mapped_column(Integer, ForeignKey("checklist_modelos.id", ondelete="CASCADE"), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    obrigatorio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")

    modelo: Mapped["ChecklistModelo"] = relationship("ChecklistModelo", back_populates="itens")


class ClienteDocumentacao(Base):
    """Checklist atribuído a um cliente da carteira + token de partilha."""

    __tablename__ = "cliente_documentacoes"
    __table_args__ = (UniqueConstraint("cliente_manual_id", name="uq_cliente_documentacao_cliente"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cliente_manual_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("clientes_manuais.id", ondelete="CASCADE"),
        nullable=False,
    )
    modelo_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("checklist_modelos.id", ondelete="RESTRICT"),
        nullable=False,
    )
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    portal_bloqueado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    entregas: Mapped[list["ClienteDocumentoEntrega"]] = relationship(
        "ClienteDocumentoEntrega",
        back_populates="documentacao",
        cascade="all, delete-orphan",
    )


class ClienteDocumentoEntrega(Base):
    __tablename__ = "cliente_documento_entregas"
    __table_args__ = (
        UniqueConstraint("cliente_documentacao_id", "checklist_item_id", name="uq_doc_entrega_item"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cliente_documentacao_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("cliente_documentacoes.id", ondelete="CASCADE"),
        nullable=False,
    )
    checklist_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("checklist_itens.id", ondelete="CASCADE"),
        nullable=False,
    )
    arquivo_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    arquivo_path: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tamanho_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    documentacao: Mapped["ClienteDocumentacao"] = relationship("ClienteDocumentacao", back_populates="entregas")
