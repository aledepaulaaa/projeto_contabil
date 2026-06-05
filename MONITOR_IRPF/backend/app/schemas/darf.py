from decimal import Decimal

from pydantic import BaseModel, Field


class DarfItemOut(BaseModel):
    declaracao_id: int
    titular_nome: str
    titular_cpf: str | None = None
    valor_imposto: Decimal
    quantidade_parcelas: int
    debito_automatico: bool


class DarfListaOut(BaseModel):
    ano_calendario: int
    itens: list[DarfItemOut]


class DarfGerarIn(BaseModel):
    parcela: int = Field(ge=1)
    confirmar_debito_automatico: bool = False


class DarfGerarOut(BaseModel):
    declaracao_id: int
    ano_calendario: int
    titular_nome: str
    titular_cpf: str | None = None
    parcela: int
    total_parcelas: int
    valor_parcela: Decimal
    valor_imposto_total: Decimal
    debito_automatico: bool
    referencia: str
    message: str
