from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class DeclaracaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ano_calendario: int
    titular_nome: str
    titular_cpf: str | None = None
    status: str
    data_entrega: date | None = None
    numero_recibo: str | None = None
    caminho_arquivo_declaracao: str | None = None
    caminho_arquivo_recibo: str | None = None
    evolucao_patrimonial_resumo: str | None = None
    rendimentos_tributaveis_total: Decimal | None = None
    rendimentos_isentos_total: Decimal | None = None
    patrimonio_liquido_declarado: Decimal | None = None
    resultado_fiscal: str | None = None
    valor_imposto_ou_restituicao: Decimal | None = None
    imposto_quantidade_parcelas: int | None = None
    imposto_debito_automatico: bool | None = None
    restituicao_paga: bool | None = None
    data_pagamento_restituicao: date | None = None
    indicacao_malha_fina: bool | None = None
    observacoes_monitoramento: str | None = None
    observacoes: str | None = None
    usuario_responsavel_id: int | None = None
    status_processamento_rfb: str | None = None
    created_at: datetime
    updated_at: datetime


class DeclaracaoCreate(BaseModel):
    ano_calendario: int
    titular_nome: str
    titular_cpf: str | None = None
    status: str = "em_edicao"
    data_entrega: date | None = None
    numero_recibo: str | None = None
    caminho_arquivo_declaracao: str | None = None
    caminho_arquivo_recibo: str | None = None
    evolucao_patrimonial_resumo: str | None = None
    rendimentos_tributaveis_total: Decimal | None = None
    rendimentos_isentos_total: Decimal | None = None
    patrimonio_liquido_declarado: Decimal | None = None
    resultado_fiscal: str | None = None
    valor_imposto_ou_restituicao: Decimal | None = None
    imposto_quantidade_parcelas: int | None = None
    imposto_debito_automatico: bool | None = None
    restituicao_paga: bool | None = None
    data_pagamento_restituicao: date | None = None
    indicacao_malha_fina: bool | None = None
    observacoes_monitoramento: str | None = None
    observacoes: str | None = None
    usuario_responsavel_id: int | None = None
    status_processamento_rfb: str | None = None


class DeclaracaoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ano_calendario: int | None = None
    titular_nome: str | None = None
    titular_cpf: str | None = None
    status: str | None = None
    data_entrega: date | None = None
    numero_recibo: str | None = None
    caminho_arquivo_declaracao: str | None = None
    caminho_arquivo_recibo: str | None = None
    evolucao_patrimonial_resumo: str | None = None
    rendimentos_tributaveis_total: Decimal | None = None
    rendimentos_isentos_total: Decimal | None = None
    patrimonio_liquido_declarado: Decimal | None = None
    resultado_fiscal: str | None = None
    valor_imposto_ou_restituicao: Decimal | None = None
    imposto_quantidade_parcelas: int | None = None
    imposto_debito_automatico: bool | None = None
    restituicao_paga: bool | None = None
    data_pagamento_restituicao: date | None = None
    indicacao_malha_fina: bool | None = None
    observacoes_monitoramento: str | None = None
    observacoes: str | None = None
    usuario_responsavel_id: int | None = None
    status_processamento_rfb: str | None = None


class DiscoArea(BaseModel):
    label: str
    total_bytes: int
    truncado: bool = False


class DashboardResumoOut(BaseModel):
    por_status: dict[str, int]
    por_resultado: dict[str, int]
    por_ano: list[dict[str, int | str]]
    disco: dict[str, list[DiscoArea]] = Field(default_factory=lambda: {"areas": []})
