from datetime import datetime

from pydantic import BaseModel, Field


class DiagnosticoFiscalItemOut(BaseModel):
    cpf: str
    nome: str
    situacao: str
    situacao_label: str
    email: str | None = None
    telefone: str | None = None
    consultado_em: datetime | None = None
    tem_resultado: bool = False


class DiagnosticoFiscalListaOut(BaseModel):
    ano_calendario: int
    rfb_habilitado: bool
    itens: list[DiagnosticoFiscalItemOut]


class DiagnosticoFiscalAtualizarOut(BaseModel):
    ok: bool
    cpf: str | None = None
    consultadas: int
    message: str


class DiagnosticoFiscalDetalheOut(BaseModel):
    cpf: str
    nome: str
    ano_calendario: int
    situacao: str
    situacao_label: str
    consultado_em: datetime | None = None
    resultado: dict | None = None
    historico: list[dict] = Field(default_factory=list)
