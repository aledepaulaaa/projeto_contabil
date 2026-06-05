from datetime import date, datetime

from pydantic import BaseModel, Field


class MalhaItemOut(BaseModel):
    declaracao_id: int
    titular_nome: str
    titular_cpf: str | None = None
    data_entrega: date | None = None
    numero_recibo: str | None = None
    status_processamento_rfb: str | None = None
    malha_motivo_resumo: str | None = None
    malha_consultado_em: datetime | None = None


class MalhaListaOut(BaseModel):
    ano_calendario: int
    itens: list[MalhaItemOut]


class MalhaPendenciaOut(BaseModel):
    codigo: str | None = None
    descricao: str


class MalhaDetalheOut(BaseModel):
    declaracao_id: int
    ano_calendario: int
    titular_nome: str
    titular_cpf: str | None = None
    data_entrega: date | None = None
    numero_recibo: str | None = None
    status_processamento_rfb: str | None = None
    em_malha: bool
    malha_motivo_rfb: str | None = None
    pendencias: list[MalhaPendenciaOut] = Field(default_factory=list)
    malha_consultado_em: datetime | None = None
    fonte_consulta: str = "simulacao"


class MalhaAtualizarOut(BaseModel):
    ok: bool
    ano_calendario: int | None = None
    declaracao_id: int | None = None
    consultadas: int
    em_malha: int
    message: str
