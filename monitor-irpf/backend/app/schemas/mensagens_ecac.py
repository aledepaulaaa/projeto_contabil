from datetime import datetime

from pydantic import BaseModel, Field


class MensagemEcacOut(BaseModel):
    id: str
    assunto: str
    data: str
    lida: bool
    corpo_resumo: str | None = None


class MensagensEcacItemOut(BaseModel):
    cpf: str
    nome: str
    total_mensagens: int
    nao_lidas: int
    status_label: str
    todas_lidas: bool
    email: str | None = None
    telefone: str | None = None
    consultado_em: datetime | None = None


class MensagensEcacListaOut(BaseModel):
    ano_calendario: int
    integracao_habilitada: bool
    itens: list[MensagensEcacItemOut]


class MensagensEcacCaixaOut(BaseModel):
    cpf: str
    nome: str
    ano_calendario: int
    total_mensagens: int
    nao_lidas: int
    mensagens: list[MensagemEcacOut]


class MensagensEcacAtualizarOut(BaseModel):
    ok: bool
    cpf: str | None = None
    consultadas: int
    message: str


class MensagensEcacPontuaisIn(BaseModel):
    cpf: str
    ano_calendario: int
