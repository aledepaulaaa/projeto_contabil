from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

TipoPrecificacaoCliente = Literal["padrao", "minimo", "maximo", "personalizado", "bonificado"]


class ClienteListRowOut(BaseModel):
    """Uma linha na carteira de clientes do exercício."""

    estado_key: str = Field(description="Sempre manual:{id}.")
    origem_cadastro: str = Field(description="manual | importacao_ano_anterior | sinc_declaracoes")
    nome: str
    cpf_exibicao: str | None = None
    declaracoes_count: int | None = None
    manual_id: int
    telefone: str | None = None
    email: str | None = None
    observacoes: str | None = None
    cpf_digits: str | None = Field(
        default=None,
        description="Somente dígitos; null se sem CPF válido.",
    )
    ativo: bool = True
    honorarios_em_aberto: bool = False
    tem_declaracao_exercicio: bool = False
    tem_procuracao_exercicio: bool = False
    declaracao_responsaveis: str | None = Field(
        default=None,
        description="Nomes dos usuários responsáveis nas declarações deste exercício (único texto, separado por vírgula).",
    )
    tipo_precificacao: TipoPrecificacaoCliente = "padrao"
    valor_personalizado: Decimal | None = None
    asaas_customer_id: str | None = Field(
        default=None,
        max_length=64,
        description="ID do cliente no Asaas (cus_…), para gerar cobrança em Precificação e Cobrança.",
    )


class ClienteManualCreate(BaseModel):
    ano_carteira: int = Field(..., description="Ano-calendário IRPF da carteira.")
    nome: str = Field(..., min_length=1, max_length=255)
    cpf: str | None = Field(None, max_length=20)
    telefone: str | None = Field(None, max_length=40)
    email: str | None = Field(None, max_length=255)
    observacoes: str | None = None
    ativo: bool = True
    tipo_precificacao: TipoPrecificacaoCliente = "padrao"
    valor_personalizado: Decimal | None = Field(None, ge=0)
    asaas_customer_id: str | None = Field(None, max_length=64)

    @model_validator(mode="after")
    def _preco_personalizado_obrigatorio(self) -> "ClienteManualCreate":
        if self.tipo_precificacao == "personalizado":
            if self.valor_personalizado is None or self.valor_personalizado <= 0:
                raise ValueError("Para «valor personalizado», indique um valor maior que zero.")
        return self


class ClienteManualUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=255)
    cpf: str | None = Field(None, max_length=20)
    telefone: str | None = Field(None, max_length=40)
    email: str | None = Field(None, max_length=255)
    observacoes: str | None = None
    ativo: bool | None = None
    tipo_precificacao: TipoPrecificacaoCliente | None = None
    valor_personalizado: Decimal | None = None


class ClienteManualOut(BaseModel):
    id: int
    ano_carteira: int
    origem_cadastro: str
    nome: str
    cpf: str | None
    telefone: str | None
    email: str | None
    observacoes: str | None
    ativo: bool
    tipo_precificacao: str
    valor_personalizado: Decimal | None
    asaas_customer_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClienteToggleAtivoIn(BaseModel):
    estado_key: str = Field(..., min_length=3, max_length=128, description="Formato manual:{id}.")
    ativo: bool
    ano_calendario: int = Field(..., description="Exercício selecionado na UI (ano-calendário IRPF).")


class ClienteImportarAnoIn(BaseModel):
    ano_origem: int = Field(..., description="Ano-calendário de origem (ex.: ano anterior).")
    ano_destino: int = Field(..., description="Carteira atual (exercício selecionado).")


class ClienteImportarAnoOut(BaseModel):
    criados: int
    message: str


class ClienteSincronizarDeclOut(BaseModel):
    criados: int
    message: str
