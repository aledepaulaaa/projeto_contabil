from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

RESTITUICAO_STATUS = ("a_restituir", "pendente", "restituido", "erro_credito")


class RestituicaoItemOut(BaseModel):
    declaracao_id: int
    titular_nome: str
    titular_cpf: str | None = None
    data_entrega: date | None = None
    numero_recibo: str | None = None
    valor_restituicao: Decimal
    status_restituicao: str
    status_restituicao_label: str
    status_processamento_rfb: str | None = None
    em_malha: bool = False
    restituicao_consultado_em: datetime | None = None


class RestituicaoListaOut(BaseModel):
    ano_calendario: int
    itens: list[RestituicaoItemOut]


class RestituicaoEventoOut(BaseModel):
    data: str | None = None
    descricao: str


class RestituicaoDetalheOut(BaseModel):
    declaracao_id: int
    ano_calendario: int
    titular_nome: str
    titular_cpf: str | None = None
    data_entrega: date | None = None
    numero_recibo: str | None = None
    valor_restituicao: Decimal
    status_restituicao: str
    status_restituicao_label: str
    status_processamento_rfb: str | None = None
    em_malha: bool
    restituicao_paga: bool | None = None
    data_pagamento_restituicao: date | None = None
    restituicao_erro_motivo: str | None = None
    observacao: str | None = None
    historico: list[RestituicaoEventoOut] = Field(default_factory=list)
    restituicao_consultado_em: datetime | None = None
    fonte_consulta: str = "simulacao"


class RestituicaoAtualizarOut(BaseModel):
    ok: bool
    ano_calendario: int | None = None
    declaracao_id: int | None = None
    consultadas: int
    message: str
